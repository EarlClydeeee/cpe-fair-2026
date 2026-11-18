-- Category → Competition hierarchy (schema only — admins populate data).

-- ---------------------------------------------------------------------------
-- Categories: archive flag
-- ---------------------------------------------------------------------------

alter table public.categories
  add column if not exists is_archived boolean not null default false;

-- ---------------------------------------------------------------------------
-- Competitions
-- ---------------------------------------------------------------------------

create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  sort_order integer not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, slug)
);

create index if not exists competitions_season_id_idx on public.competitions (season_id);
create index if not exists competitions_category_id_idx on public.competitions (category_id);

drop trigger if exists set_updated_at on public.competitions;
create trigger set_updated_at
  before update on public.competitions
  for each row execute function public.set_updated_at();

alter table public.competitions enable row level security;

drop policy if exists "competitions: public read" on public.competitions;
create policy "competitions: public read" on public.competitions
  for select to anon, authenticated using (true);

drop policy if exists "competitions: staff write" on public.competitions;
create policy "competitions: staff write" on public.competitions
  for all to authenticated
  using ((select public.can_manage_content()))
  with check ((select public.can_manage_content()));

-- ---------------------------------------------------------------------------
-- Scores: competition grain (wipe rows that cannot attach — fresh admin data)
-- ---------------------------------------------------------------------------

alter table public.published_scores
  add column if not exists competition_id uuid references public.competitions (id) on delete cascade;

alter table public.score_drafts
  add column if not exists competition_id uuid references public.competitions (id) on delete cascade;

-- Clear legacy category-only scores/drafts; admins re-enter under competitions
delete from public.score_drafts where competition_id is null;
delete from public.published_scores where competition_id is null;

alter table public.published_scores drop constraint if exists published_scores_team_id_category_id_key;
alter table public.score_drafts drop constraint if exists score_drafts_team_id_category_id_key;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'published_scores_team_id_competition_id_key'
  ) then
    alter table public.published_scores
      add constraint published_scores_team_id_competition_id_key
      unique (team_id, competition_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'score_drafts_team_id_competition_id_key'
  ) then
    alter table public.score_drafts
      add constraint score_drafts_team_id_competition_id_key
      unique (team_id, competition_id);
  end if;
end;
$$;

-- competition_id stays nullable until first admin scores exist; RPCs always set it.
-- Enforce NOT NULL only when no nulls remain (fresh wipe above leaves table empty).
do $$
begin
  if not exists (select 1 from public.published_scores where competition_id is null) then
    alter table public.published_scores alter column competition_id set not null;
  end if;
  if not exists (select 1 from public.score_drafts where competition_id is null) then
    alter table public.score_drafts alter column competition_id set not null;
  end if;
end;
$$;

create index if not exists published_scores_competition_id_idx on public.published_scores (competition_id);
create index if not exists score_drafts_competition_id_idx on public.score_drafts (competition_id);

-- ---------------------------------------------------------------------------
-- Events: competition_id required for new rows; clear orphans
-- ---------------------------------------------------------------------------

alter table public.events
  add column if not exists competition_id uuid references public.competitions (id) on delete restrict;

delete from public.events where competition_id is null;

do $$
begin
  if not exists (select 1 from public.events where competition_id is null) then
    alter table public.events alter column competition_id set not null;
  end if;
end;
$$;

create index if not exists events_competition_id_idx on public.events (competition_id);

-- ---------------------------------------------------------------------------
-- RPCs keyed on competition_id
-- ---------------------------------------------------------------------------

-- Same arg types as the old RPC; DROP so the parameter can be renamed
-- p_category_id → p_competition_id (CREATE OR REPLACE cannot rename args).
drop function if exists public.save_score_draft(uuid, uuid, integer, text);

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
  if uid is null or not public.can_score() then
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

revoke execute on function public.save_score_draft(uuid, uuid, integer, text) from public, anon;
grant execute on function public.save_score_draft(uuid, uuid, integer, text) to authenticated;

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

revoke execute on function public.publish_score_drafts(uuid[]) from public, anon;
grant execute on function public.publish_score_drafts(uuid[]) to authenticated;
