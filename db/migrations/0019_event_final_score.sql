-- Optional final score text for ended events (e.g. "25-23, 25-20" or "3-1").

alter table public.events
  add column if not exists final_score text not null default '';

notify pgrst, 'reload schema';
