-- Event scheduling, spotlight, winner, and computed-status model

create type public.event_match_type as enum ('head_to_head', 'all_teams');
create type public.event_status_override as enum ('auto', 'upcoming', 'ongoing', 'ended');

-- Drop policies that reference events.status before reshaping
drop policy if exists "events: public read non-archived" on public.events;

alter table public.events rename column title to name;
alter table public.events rename column starts_at to start_at;

alter table public.events
  add column if not exists end_at timestamptz,
  add column if not exists match_type public.event_match_type,
  add column if not exists match_format text,
  add column if not exists winner_team_id uuid references public.competition_teams (id) on delete set null,
  add column if not exists result_note text,
  add column if not exists is_highlighted boolean not null default false,
  add column if not exists status_override public.event_status_override not null default 'auto',
  add column if not exists is_archived boolean not null default false;

-- Backfill from legacy columns
update public.events
set
  end_at = coalesce(end_at, start_at + interval '2 hours'),
  match_type = coalesce(
    match_type,
    case
      when team_a_id is not null and team_b_id is not null then 'head_to_head'::public.event_match_type
      else 'all_teams'::public.event_match_type
    end
  ),
  match_format = coalesce(
    match_format,
    nullif(trim(notes), '')
  ),
  is_archived = coalesce(is_archived, status = 'archived'),
  status_override = coalesce(
    status_override,
    case status
      when 'upcoming' then 'auto'::public.event_status_override
      when 'in_progress' then 'ongoing'::public.event_status_override
      when 'final' then 'ended'::public.event_status_override
      else 'auto'::public.event_status_override
    end
  );

alter table public.events
  alter column end_at set not null,
  alter column match_type set not null,
  alter column match_format set default '',
  alter column result_note set default '';

update public.events set match_format = coalesce(match_format, '');
update public.events set result_note = coalesce(result_note, '');

alter table public.events
  alter column match_format set not null,
  alter column result_note set not null;

alter table public.events drop column if exists status;
alter table public.events drop column if exists notes;
alter table public.events drop column if exists day_number;

drop type if exists public.event_status;

alter table public.events
  drop constraint if exists events_end_after_start;

alter table public.events
  add constraint events_end_after_start check (end_at > start_at);

drop index if exists public.events_season_starts_idx;
drop index if exists public.events_status_idx;

create index events_season_start_idx on public.events (season_id, start_at);
create index events_season_highlighted_idx on public.events (season_id, is_highlighted)
  where is_highlighted = true;

create unique index events_one_spotlight_per_season
  on public.events (season_id)
  where is_highlighted = true and is_archived = false;

create policy "events: public read non-archived" on public.events
  for select to anon, authenticated
  using (is_archived = false or (select public.is_staff()));
