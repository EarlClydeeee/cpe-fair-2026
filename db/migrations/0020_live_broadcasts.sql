-- Facebook Live broadcast config (one row per season).

create table if not exists public.live_broadcasts (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  title text not null default 'Live now',
  facebook_url text not null default '',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint live_broadcasts_season_unique unique (season_id)
);

create index if not exists live_broadcasts_active_idx
  on public.live_broadcasts (is_active)
  where is_active = true;

drop trigger if exists set_updated_at on public.live_broadcasts;
create trigger set_updated_at
  before update on public.live_broadcasts
  for each row execute function public.set_updated_at();

alter table public.live_broadcasts enable row level security;

drop policy if exists "live_broadcasts: public read" on public.live_broadcasts;
create policy "live_broadcasts: public read" on public.live_broadcasts
  for select to anon, authenticated using (true);

drop policy if exists "live_broadcasts: content write" on public.live_broadcasts;
create policy "live_broadcasts: content write" on public.live_broadcasts
  for all to authenticated
  using ((select public.can_manage_content()))
  with check ((select public.can_manage_content()));

grant select on public.live_broadcasts to anon, authenticated;
grant select, insert, update, delete on public.live_broadcasts to authenticated;
grant all on public.live_broadcasts to service_role;

do $$
begin
  alter publication supabase_realtime add table public.live_broadcasts;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- Include live broadcasts in the season content wipe.
create or replace function public.clear_season_content()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  truncate table
    public.live_broadcasts,
    public.score_drafts,
    public.published_scores,
    public.events,
    public.competition_teams,
    public.competitions,
    public.categories,
    public.audit_log,
    public.admin_invitations
  restart identity cascade;

  insert into public.seasons (id, slug, name, year, is_active)
  values (
    '11111111-1111-1111-1111-111111111111',
    'cpe-fair-2026',
    'CPE Fair 2026',
    2026,
    true
  )
  on conflict (slug) do update
    set name = excluded.name,
        year = excluded.year,
        is_active = true;
end;
$$;

revoke all on function public.clear_season_content() from public;
grant execute on function public.clear_season_content() to service_role;

notify pgrst, 'reload schema';
