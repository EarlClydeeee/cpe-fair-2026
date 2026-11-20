-- Allow score drafts for categories with include_in_scoring = false.
-- Those points still rank in the category's own leaderboard filter,
-- but public overall totals continue to exclude them in app code.

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

notify pgrst, 'reload schema';
