-- GREENFIELD ONLY — API grants, season bootstrap, optional owner profile.

grant usage on schema public to anon, authenticated, service_role;

grant select on
  public.seasons,
  public.categories,
  public.competitions,
  public.competition_teams,
  public.events,
  public.published_scores,
  public.live_broadcasts
to anon, authenticated;

grant select on public.audit_log to authenticated;

grant select, update on public.profiles to authenticated;

grant select, insert, update, delete on
  public.seasons,
  public.categories,
  public.competitions,
  public.competition_teams,
  public.events,
  public.published_scores,
  public.score_drafts,
  public.admin_invitations,
  public.audit_log,
  public.live_broadcasts
to authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to authenticated, service_role;

revoke all on function public.clear_season_content() from public;
grant execute on function public.clear_season_content() to service_role;

revoke all on function public.save_score_draft(uuid, uuid, integer, text) from public;
revoke all on function public.publish_score_drafts(uuid[]) from public;
grant execute on function public.save_score_draft(uuid, uuid, integer, text)
  to authenticated, service_role;
grant execute on function public.publish_score_drafts(uuid[])
  to authenticated, service_role;
revoke execute on function public.save_score_draft(uuid, uuid, integer, text) from anon;
revoke execute on function public.publish_score_drafts(uuid[]) from anon;

grant execute on function
  public.current_role(),
  public.is_staff(),
  public.is_owner(),
  public.can_manage_content(),
  public.can_manage_events(),
  public.can_score()
to authenticated;

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

-- Optional: promote existing Auth user admin@gmail.com to owner (no-op if absent).
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', 'Admin'),
  'owner'::public.admin_role
from auth.users u
where lower(u.email) = lower('admin@gmail.com')
on conflict (id) do update
set
  role = 'owner',
  email = excluded.email,
  full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name);

notify pgrst, 'reload schema';
