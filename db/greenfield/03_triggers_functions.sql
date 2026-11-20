-- GREENFIELD ONLY — triggers + canonical RPCs (service_role scoring + season wipe).

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'seasons', 'categories', 'competitions', 'competition_teams',
    'events', 'published_scores', 'score_drafts', 'admin_invitations'
  ] loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invited public.admin_role;
begin
  select role into invited
  from public.admin_invitations
  where lower(email) = lower(new.email)
    and status = 'pending'
  order by created_at desc
  limit 1;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    invited
  );

  if invited is not null then
    update public.admin_invitations
    set status = 'accepted', updated_at = now()
    where lower(email) = lower(new.email) and status = 'pending';
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and (select auth.uid()) is not null
     and not public.is_owner() then
    raise exception 'Only the workspace owner can change roles';
  end if;
  return new;
end;
$$;

create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- Scoring RPCs (access-code admin uses service_role; no auth.uid required)

create or replace function public.save_score_draft(
  p_team_id uuid,
  p_competition_id uuid,
  p_draft_points integer,
  p_reason text
)
returns public.score_drafts
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  published_points integer;
  season uuid;
  cat_id uuid;
  draft public.score_drafts%rowtype;
begin
  if coalesce(auth.role(), '') = 'service_role' then
    if uid is null then
      select id into uid
      from public.profiles
      where role = 'owner'
      order by created_at
      limit 1;
    end if;
  elsif uid is null or not public.can_score() then
    raise exception 'Not allowed to edit scores';
  end if;

  select c.category_id, c.season_id into cat_id, season
  from public.competitions c
  join public.categories cat on cat.id = c.category_id
  where c.id = p_competition_id
    and c.is_archived = false
    and cat.is_archived = false;

  if cat_id is null then
    raise exception 'Competition not found or category is archived';
  end if;

  select points into published_points
  from public.published_scores
  where team_id = p_team_id and competition_id = p_competition_id;

  insert into public.score_drafts (
    team_id, category_id, competition_id, draft_points, reason, saved_by, saved_at
  )
  values (
    p_team_id, cat_id, p_competition_id, p_draft_points, coalesce(p_reason, ''), uid, now()
  )
  on conflict (team_id, competition_id) do update
    set draft_points = excluded.draft_points,
        reason = excluded.reason,
        category_id = excluded.category_id,
        saved_by = excluded.saved_by,
        saved_at = excluded.saved_at,
        updated_at = now()
  returning * into draft;

  insert into public.audit_log (
    season_id, actor_id, action, entity_type, entity_id, summary, before_json, after_json
  ) values (
    season,
    uid,
    'draft_saved',
    'score_draft',
    draft.id,
    format('%s → %s pts', coalesce(published_points::text, '0'), p_draft_points),
    jsonb_build_object('points', published_points),
    jsonb_build_object(
      'draft_points', p_draft_points,
      'reason', p_reason,
      'team_id', p_team_id,
      'competition_id', p_competition_id,
      'category_id', cat_id
    )
  );

  return draft;
end;
$$;

create or replace function public.publish_score_drafts(p_draft_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  d public.score_drafts%rowtype;
  published_points integer;
  published_id uuid;
  season uuid;
  n integer := 0;
  requested integer;
  locked_ids uuid[];
begin
  if coalesce(auth.role(), '') = 'service_role' then
    if uid is null then
      select id into uid
      from public.profiles
      where role = 'owner'
      order by created_at
      limit 1;
    end if;
  elsif uid is null or not public.can_score() then
    raise exception 'Not allowed to publish scores';
  end if;

  if p_draft_ids is null or cardinality(p_draft_ids) = 0 then
    return 0;
  end if;

  requested := cardinality(p_draft_ids);

  select coalesce(array_agg(id), '{}'::uuid[])
  into locked_ids
  from (
    select id
    from public.score_drafts
    where id = any (p_draft_ids)
    for update
  ) locked;

  if cardinality(locked_ids) <> requested then
    raise exception 'One or more drafts are missing or already published';
  end if;

  for d in
    select * from public.score_drafts where id = any (locked_ids)
  loop
    select points into published_points
    from public.published_scores
    where team_id = d.team_id and competition_id = d.competition_id;

    insert into public.published_scores (
      team_id, category_id, competition_id, points, published_by, published_at
    )
    values (
      d.team_id, d.category_id, d.competition_id, d.draft_points, uid, now()
    )
    on conflict (team_id, competition_id) do update
      set points = excluded.points,
          category_id = excluded.category_id,
          published_by = excluded.published_by,
          published_at = excluded.published_at,
          updated_at = now()
    returning id into published_id;

    select season_id into season from public.competition_teams where id = d.team_id;

    insert into public.audit_log (
      season_id, actor_id, action, entity_type, entity_id, summary, before_json, after_json
    ) values (
      season,
      uid,
      'published',
      'score',
      published_id,
      format('Published %s → %s pts', coalesce(published_points::text, '0'), d.draft_points),
      jsonb_build_object(
        'points', published_points,
        'team_id', d.team_id,
        'competition_id', d.competition_id,
        'category_id', d.category_id
      ),
      jsonb_build_object(
        'points', d.draft_points,
        'reason', d.reason,
        'team_id', d.team_id,
        'competition_id', d.competition_id,
        'category_id', d.category_id,
        'draft_id', d.id
      )
    );

    delete from public.score_drafts where id = d.id;
    n := n + 1;
  end loop;

  return n;
end;
$$;

create or replace function public.clear_season_content()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  truncate table
    public.score_drafts,
    public.published_scores,
    public.events,
    public.competition_teams,
    public.competitions,
    public.categories,
    public.audit_log,
    public.admin_invitations
  restart identity cascade;

  insert into public.seasons (id, slug, name, year, is_active)
  values (
    '11111111-1111-1111-1111-111111111111',
    'cpe-fair-2026',
    'CPE Fair 2026',
    2026,
    true
  )
  on conflict (slug) do update
    set name = excluded.name,
        year = excluded.year,
        is_active = true;
end;
$$;
