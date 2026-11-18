-- GREENFIELD ONLY — final ACCESS CPE Fair 2026 schema (no legacy alters).
-- Do not run this against a live DB that already applied db/migrations/.

create extension if not exists pgcrypto;

-- Enums ---------------------------------------------------------------------

create type public.admin_role as enum (
  'owner',
  'site_admin',
  'scoring_admin',
  'events_editor'
);

create type public.team_visibility as enum ('active', 'archived');

create type public.invitation_status as enum ('pending', 'accepted', 'revoked');

create type public.audit_action as enum (
  'draft_saved',
  'published',
  'event_updated',
  'team_updated',
  'admin_invited',
  'role_changed',
  'invitation_revoked'
);

create type public.event_match_type as enum ('head_to_head', 'all_teams');

create type public.event_status_override as enum (
  'auto',
  'upcoming',
  'ongoing',
  'ended'
);

-- Profiles ------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text,
  role public.admin_role,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Season / taxonomy / teams -------------------------------------------------

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  year integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  sort_order integer not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, slug)
);

create table public.competitions (
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

create index competitions_season_id_idx on public.competitions (season_id);
create index competitions_category_id_idx on public.competitions (category_id);

create table public.competition_teams (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  name text not null,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  affiliation text not null default '',
  color_hex text not null default '#FF6B21' check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  artwork_url text,
  visibility public.team_visibility not null default 'active',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, slug)
);

create index competition_teams_season_id_idx on public.competition_teams (season_id);

-- Events --------------------------------------------------------------------

create table public.events (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  competition_id uuid not null references public.competitions (id) on delete restrict,
  name text not null,
  match_type public.event_match_type not null,
  team_a_id uuid references public.competition_teams (id) on delete set null,
  team_b_id uuid references public.competition_teams (id) on delete set null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  venue text not null default '',
  match_format text not null default '',
  winner_team_id uuid references public.competition_teams (id) on delete set null,
  result_note text not null default '',
  is_highlighted boolean not null default false,
  status_override public.event_status_override not null default 'auto',
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_end_after_start check (end_at > start_at)
);

create index events_season_start_idx on public.events (season_id, start_at);
create index events_category_id_idx on public.events (category_id);
create index events_competition_id_idx on public.events (competition_id);
create index events_season_highlighted_idx on public.events (season_id, is_highlighted)
  where is_highlighted = true;
create unique index events_one_spotlight_per_season
  on public.events (season_id)
  where is_highlighted = true and is_archived = false;

-- Scores (competition grain) ------------------------------------------------

create table public.published_scores (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.competition_teams (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  competition_id uuid not null references public.competitions (id) on delete cascade,
  points integer not null default 0 check (points >= 0),
  published_at timestamptz not null default now(),
  published_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, competition_id)
);

create index published_scores_category_id_idx on public.published_scores (category_id);
create index published_scores_competition_id_idx on public.published_scores (competition_id);

create table public.score_drafts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.competition_teams (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  competition_id uuid not null references public.competitions (id) on delete cascade,
  draft_points integer not null check (draft_points >= 0),
  reason text not null default '',
  saved_by uuid references public.profiles (id) on delete set null,
  saved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, competition_id)
);

create index score_drafts_competition_id_idx on public.score_drafts (competition_id);

-- Admin invitations (optional; access-code login is primary) -----------------

create table public.admin_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role public.admin_role not null,
  invited_by uuid references public.profiles (id) on delete set null,
  status public.invitation_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index admin_invitations_email_idx on public.admin_invitations (lower(email));

-- Audit ---------------------------------------------------------------------

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references public.seasons (id) on delete set null,
  actor_id uuid references public.profiles (id) on delete set null,
  action public.audit_action not null,
  entity_type text not null,
  entity_id uuid,
  summary text not null default '',
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_created_at_idx on public.audit_log (created_at desc);
create index audit_log_season_id_idx on public.audit_log (season_id);
