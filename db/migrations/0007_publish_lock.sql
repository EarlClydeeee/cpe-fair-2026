-- Harden publish_score_drafts: row locks, missing-id check, richer audit payload.

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
  if uid is null or not public.can_score() then
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
    where team_id = d.team_id and category_id = d.category_id;

    insert into public.published_scores (team_id, category_id, points, published_by, published_at)
    values (d.team_id, d.category_id, d.draft_points, uid, now())
    on conflict (team_id, category_id) do update
      set points = excluded.points,
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
        'category_id', d.category_id
      ),
      jsonb_build_object(
        'points', d.draft_points,
        'reason', d.reason,
        'team_id', d.team_id,
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

revoke execute on function public.publish_score_drafts(uuid[]) from public, anon;
grant execute on function public.publish_score_drafts(uuid[]) to authenticated;
