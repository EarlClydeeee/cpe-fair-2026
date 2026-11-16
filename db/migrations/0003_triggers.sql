-- ACCESS CPE Fair 2026: triggers and RPCs

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
    'profiles', 'seasons', 'categories', 'competition_teams', 'events',
    'published_scores', 'score_drafts', 'admin_invitations'
  ] loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end;
$$;

-- Profile on signup ---------------------------------------------------------

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

-- Protect role changes ------------------------------------------------------

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

-- Publish drafts RPC --------------------------------------------------------

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
  season uuid;
  n integer := 0;
begin
  if uid is null or not public.can_score() then
    raise exception 'Not allowed to publish scores';
  end if;

  for d in
    select * from public.score_drafts where id = any (p_draft_ids)
  loop
    select points into published_points
    from public.published_scores
    where team_id = d.team_id and category_id = d.category_id;

    insert into public.published_scores (team_id, category_id, points, published_by, published_at)
    values (d.team_id, d.category_id, d.draft_points, uid, now())
    on conflict (team_id, category_id) do update
      set points = excluded.points,
          published_by = excluded.published_by,
          published_at = excluded.published_at,
          updated_at = now();

    select season_id into season from public.competition_teams where id = d.team_id;

    insert into public.audit_log (
      season_id, actor_id, action, entity_type, entity_id, summary, before_json, after_json
    ) values (
      season,
      uid,
      'published',
      'score',
      d.id,
      format('Published %s → %s pts', coalesce(published_points::text, '0'), d.draft_points),
      jsonb_build_object('points', published_points),
      jsonb_build_object('points', d.draft_points, 'reason', d.reason, 'team_id', d.team_id, 'category_id', d.category_id)
    );

    delete from public.score_drafts where id = d.id;
    n := n + 1;
  end loop;

  return n;
end;
$$;

create or replace function public.save_score_draft(
  p_team_id uuid,
  p_category_id uuid,
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
  draft public.score_drafts%rowtype;
begin
  if uid is null or not public.can_score() then
    raise exception 'Not allowed to edit scores';
  end if;

  select points into published_points
  from public.published_scores
  where team_id = p_team_id and category_id = p_category_id;

  insert into public.score_drafts (team_id, category_id, draft_points, reason, saved_by, saved_at)
  values (p_team_id, p_category_id, p_draft_points, coalesce(p_reason, ''), uid, now())
  on conflict (team_id, category_id) do update
    set draft_points = excluded.draft_points,
        reason = excluded.reason,
        saved_by = excluded.saved_by,
        saved_at = excluded.saved_at,
        updated_at = now()
  returning * into draft;

  select season_id into season from public.competition_teams where id = p_team_id;

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
    jsonb_build_object('draft_points', p_draft_points, 'reason', p_reason, 'team_id', p_team_id, 'category_id', p_category_id)
  );

  return draft;
end;
$$;

revoke execute on function
  public.publish_score_drafts(uuid[]),
  public.save_score_draft(uuid, uuid, integer, text)
from public, anon;

grant execute on function
  public.publish_score_drafts(uuid[]),
  public.save_score_draft(uuid, uuid, integer, text)
to authenticated;

grant execute on function
  public.current_role(),
  public.is_staff(),
  public.is_owner(),
  public.can_manage_content(),
  public.can_manage_events(),
  public.can_score()
to authenticated;
