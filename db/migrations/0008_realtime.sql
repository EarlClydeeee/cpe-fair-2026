-- Enable Supabase Realtime for public fair tables so open pages can refresh
-- without a manual reload when scores, drafts, events, or teams change.

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
