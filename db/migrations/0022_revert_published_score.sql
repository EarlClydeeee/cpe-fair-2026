-- Allow reverting a published score to the previous value recorded in audit history.

alter type public.audit_action add value if not exists 'score_reverted';

create or replace function public.revert_published_score(p_audit_id uuid)
returns public.published_scores
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  entry public.audit_log%rowtype;
  v_team_id uuid;
  v_competition_id uuid;
  v_category_id uuid;
  previous_points integer;
  published_points integer;
  current_row public.published_scores%rowtype;
  season uuid;
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
    raise exception 'Not allowed to revert scores';
  end if;

  select * into entry
  from public.audit_log
  where id = p_audit_id
  for update;

  if not found then
    raise exception 'History record not found';
  end if;

  if entry.action <> 'published' or entry.entity_type <> 'score' then
    raise exception 'Only published score history can be reverted';
  end if;

  v_team_id := nullif(entry.after_json ->> 'team_id', '')::uuid;
  v_competition_id := nullif(entry.after_json ->> 'competition_id', '')::uuid;
  v_category_id := nullif(entry.after_json ->> 'category_id', '')::uuid;
  published_points := nullif(entry.after_json ->> 'points', '')::integer;

  if v_team_id is null or v_competition_id is null then
    v_team_id := coalesce(v_team_id, nullif(entry.before_json ->> 'team_id', '')::uuid);
    v_competition_id := coalesce(
      v_competition_id,
      nullif(entry.before_json ->> 'competition_id', '')::uuid
    );
    v_category_id := coalesce(
      v_category_id,
      nullif(entry.before_json ->> 'category_id', '')::uuid
    );
  end if;

  if v_team_id is null or v_competition_id is null then
    raise exception 'History record is missing team or competition';
  end if;

  if published_points is null then
    raise exception 'History record is missing published points';
  end if;

  previous_points := nullif(entry.before_json ->> 'points', '')::integer;

  select * into current_row
  from public.published_scores ps
  where ps.team_id = v_team_id
    and ps.competition_id = v_competition_id
  for update;

  if not found then
    raise exception 'Published score no longer exists for this history record';
  end if;

  if current_row.points <> published_points then
    raise exception
      'Cannot revert — the live score changed after this publish (% pts now, history expects %)',
      current_row.points,
      published_points;
  end if;

  if v_category_id is null then
    v_category_id := current_row.category_id;
  end if;

  select season_id into season
  from public.competition_teams
  where id = v_team_id;

  if previous_points is null then
    delete from public.published_scores
    where id = current_row.id;

    insert into public.audit_log (
      season_id, actor_id, action, entity_type, entity_id, summary, before_json, after_json
    ) values (
      coalesce(entry.season_id, season),
      uid,
      'score_reverted',
      'score',
      current_row.id,
      format('Reverted publish %s → removed', published_points),
      jsonb_build_object(
        'points', published_points,
        'team_id', v_team_id,
        'competition_id', v_competition_id,
        'category_id', v_category_id,
        'audit_id', entry.id
      ),
      jsonb_build_object(
        'points', null,
        'team_id', v_team_id,
        'competition_id', v_competition_id,
        'category_id', v_category_id,
        'audit_id', entry.id
      )
    );

    return current_row;
  end if;

  update public.published_scores
  set
    points = previous_points,
    category_id = v_category_id,
    published_by = uid,
    published_at = now(),
    updated_at = now()
  where id = current_row.id
  returning * into current_row;

  insert into public.audit_log (
    season_id, actor_id, action, entity_type, entity_id, summary, before_json, after_json
  ) values (
    coalesce(entry.season_id, season),
    uid,
    'score_reverted',
    'score',
    current_row.id,
    format('Reverted publish %s → %s pts', published_points, previous_points),
    jsonb_build_object(
      'points', published_points,
      'team_id', v_team_id,
      'competition_id', v_competition_id,
      'category_id', v_category_id,
      'audit_id', entry.id
    ),
    jsonb_build_object(
      'points', previous_points,
      'team_id', v_team_id,
      'competition_id', v_competition_id,
      'category_id', v_category_id,
      'audit_id', entry.id
    )
  );

  return current_row;
end;
$$;

revoke all on function public.revert_published_score(uuid) from public;
grant execute on function public.revert_published_score(uuid)
  to authenticated, service_role;
revoke execute on function public.revert_published_score(uuid) from anon;

notify pgrst, 'reload schema';
