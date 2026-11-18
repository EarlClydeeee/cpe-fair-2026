-- ACCESS CPE Fair 2026 — minimal bootstrap only.
-- Categories, competitions, scores, and events are created by admins in the Control Room.

insert into public.seasons (id, slug, name, year, is_active)
values ('11111111-1111-1111-1111-111111111111', 'cpe-fair-2026', 'CPE Fair 2026', 2026, true)
on conflict (slug) do update
  set name = excluded.name,
      year = excluded.year,
      is_active = true;
