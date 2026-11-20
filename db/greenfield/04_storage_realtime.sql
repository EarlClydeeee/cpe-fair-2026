-- GREENFIELD ONLY — team artwork bucket + realtime publication.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'team-artwork',
  'team-artwork',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "team artwork public read" on storage.objects;
drop policy if exists "team artwork content insert" on storage.objects;
drop policy if exists "team artwork content update" on storage.objects;
drop policy if exists "team artwork content delete" on storage.objects;

create policy "team artwork public read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'team-artwork');

create policy "team artwork content insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'team-artwork' and (select public.can_manage_content()));

create policy "team artwork content update"
on storage.objects for update
to authenticated
using (bucket_id = 'team-artwork' and (select public.can_manage_content()))
with check (bucket_id = 'team-artwork' and (select public.can_manage_content()));

create policy "team artwork content delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'team-artwork' and (select public.can_manage_content()));

do $$
begin
  alter publication supabase_realtime add table public.published_scores;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.score_drafts;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.events;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.competition_teams;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.live_broadcasts;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
