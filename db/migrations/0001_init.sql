-- ACCESS CPE Fair 2026: core schema
-- Replaces the previous workshop/registration schema.

create extension if not exists pgcrypto;

-- Tear down legacy fair tables if present -----------------------------------

drop table if exists public.votes cascade;
drop table if exists public.projects cascade;
drop table if exists public.registrations cascade;
drop table if exists public.team_members cascade;
drop table if exists public.teams cascade;
drop table if exists public.faqs cascade;
drop table if exists public.announcements cascade;
drop table if exists public.sponsors cascade;
drop table if exists public.events cascade;
drop table if exists public.profiles cascade;

drop type if exists public.user_role cascade;
drop type if exists public.event_type cascade;
drop type if exists public.registration_status cascade;
drop type if exists public.sponsor_tier cascade;

-- Enums ---------------------------------------------------------------------

create type public.admin_role as enum (
  'owner',
  'site_admin',
  'scoring_admin',
  'events_editor'
);

create type public.event_status as enum (
  'upcoming',
  'in_progress',
  'final',
  'archived'
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

-- Profiles (organizers only) ------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text,
  role public.admin_role,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Season / categories / teams -----------------------------------------------

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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, slug)
);

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
  title text not null,
  team_a_id uuid references public.competition_teams (id) on delete set null,
  team_b_id uuid references public.competition_teams (id) on delete set null,
  day_number smallint not null default 1 check (day_number >= 1),
  starts_at timestamptz not null,
  venue text not null default '',
  status public.event_status not null default 'upcoming',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_season_starts_idx on public.events (season_id, starts_at);
create index events_category_id_idx on public.events (category_id);
create index events_status_idx on public.events (status);

-- Scores --------------------------------------------------------------------

create table public.published_scores (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.competition_teams (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  points integer not null default 0 check (points >= 0),
  published_at timestamptz not null default now(),
  published_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, category_id)
);

create index published_scores_category_id_idx on public.published_scores (category_id);

create table public.score_drafts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.competition_teams (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  draft_points integer not null check (draft_points >= 0),
  reason text not null default '',
  saved_by uuid references public.profiles (id) on delete set null,
  saved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, category_id)
);

-- Admin invitations ---------------------------------------------------------

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

-- Audit log -----------------------------------------------------------------

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

-- Data API grants -----------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select on
  public.seasons,
  public.categories,
  public.competition_teams,
  public.events,
  public.published_scores
to anon, authenticated;

grant select on public.audit_log to authenticated;

grant select, update on public.profiles to authenticated;

grant select, insert, update, delete on
  public.seasons,
  public.categories,
  public.competition_teams,
  public.events,
  public.published_scores,
  public.score_drafts,
  public.admin_invitations,
  public.audit_log
to authenticated;
