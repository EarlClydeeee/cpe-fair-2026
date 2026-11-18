-- Access-code admin sessions call scoring RPCs with the service_role key
-- (no auth.uid()). Allow that path so any device with a control-room session
-- can save/publish drafts. Prefer an owner profile as actor when available.

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

  select category_id, season_id into cat_id, season
  from public.competitions
  where id = p_competition_id and is_archived = false;

  if cat_id is null then
    raise exception 'Competition not found';
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

revoke all on function public.save_score_draft(uuid, uuid, integer, text) from public;
revoke all on function public.publish_score_drafts(uuid[]) from public;

grant execute on function public.save_score_draft(uuid, uuid, integer, text)
  to authenticated, service_role;
grant execute on function public.publish_score_drafts(uuid[])
  to authenticated, service_role;

revoke execute on function public.save_score_draft(uuid, uuid, integer, text) from anon;
revoke execute on function public.publish_score_drafts(uuid[]) from anon;

notify pgrst, 'reload schema';
