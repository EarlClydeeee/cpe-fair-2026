-- ACCESS CPE Fair 2026: row-level security

create or replace function public.current_role()
returns public.admin_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_role() is not null;
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_role() = 'owner';
$$;

create or replace function public.can_manage_content()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_role() in ('owner', 'site_admin');
$$;

create or replace function public.can_manage_events()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_role() in ('owner', 'site_admin', 'events_editor');
$$;

create or replace function public.can_score()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_role() in ('owner', 'scoring_admin');
$$;

alter table public.profiles enable row level security;
alter table public.seasons enable row level security;
alter table public.categories enable row level security;
alter table public.competition_teams enable row level security;
alter table public.events enable row level security;
alter table public.published_scores enable row level security;
alter table public.score_drafts enable row level security;
alter table public.admin_invitations enable row level security;
alter table public.audit_log enable row level security;

-- Profiles ------------------------------------------------------------------

create policy "profiles: read own or staff" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_staff()));

create policy "profiles: update own name" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select public.is_owner()))
  with check (id = (select auth.uid()) or (select public.is_owner()));

-- Public read content -------------------------------------------------------

create policy "seasons: public read" on public.seasons
  for select to anon, authenticated using (true);
create policy "seasons: staff write" on public.seasons
  for all to authenticated
  using ((select public.can_manage_content()))
  with check ((select public.can_manage_content()));

create policy "categories: public read" on public.categories
  for select to anon, authenticated using (true);
create policy "categories: staff write" on public.categories
  for all to authenticated
  using ((select public.can_manage_content()))
  with check ((select public.can_manage_content()));

create policy "teams: public read active" on public.competition_teams
  for select to anon, authenticated
  using (visibility = 'active' or (select public.is_staff()));
create policy "teams: content write" on public.competition_teams
  for all to authenticated
  using ((select public.can_manage_content()))
  with check ((select public.can_manage_content()));

create policy "events: public read non-archived" on public.events
  for select to anon, authenticated
  using (status <> 'archived' or (select public.is_staff()));
create policy "events: editors write" on public.events
  for all to authenticated
  using ((select public.can_manage_events()))
  with check ((select public.can_manage_events()));

create policy "published_scores: public read" on public.published_scores
  for select to anon, authenticated using (true);
create policy "published_scores: scorers write" on public.published_scores
  for all to authenticated
  using ((select public.can_score()))
  with check ((select public.can_score()));

create policy "score_drafts: scorers read" on public.score_drafts
  for select to authenticated using ((select public.can_score()));
create policy "score_drafts: scorers write" on public.score_drafts
  for all to authenticated
  using ((select public.can_score()))
  with check ((select public.can_score()));

create policy "invitations: owner read" on public.admin_invitations
  for select to authenticated using ((select public.is_owner()) or (select public.is_staff()));
create policy "invitations: owner write" on public.admin_invitations
  for all to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

create policy "audit: staff read" on public.audit_log
  for select to authenticated using ((select public.is_staff()));
create policy "audit: staff insert" on public.audit_log
  for insert to authenticated with check ((select public.is_staff()));
