-- Safe content wipe: clears fair data, keeps schema / RLS / grants / seasons / profiles.

create or replace function public.clear_season_content()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  truncate table
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
