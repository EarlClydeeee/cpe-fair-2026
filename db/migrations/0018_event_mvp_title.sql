-- Optional MVP title / award label per event (game).

alter table public.events
  add column if not exists mvp_title text not null default '';

notify pgrst, 'reload schema';
