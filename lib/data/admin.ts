import "server-only";
import { connection } from "next/server";
import { requireOwner, requireStaff } from "@/lib/auth";
import { getComputedEventStatus } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import {
  getActiveSeason,
  getCategories,
  getEvents,
  getStandings,
  getTeams,
  type FairEvent,
  type FairEventTeam,
} from "./public";
import { getDraftDiffs } from "./standings";

function toTeam(
  t: Tables<"competition_teams"> | null | undefined,
): FairEventTeam | null {
  return t ? { id: t.id, name: t.name, slug: t.slug, color_hex: t.color_hex } : null;
}

export async function getOverview() {
  // Page segment prerender is separate from layout; opt into request time before Date/auth.
  await connection();
  await requireStaff("/admin");
  const now = new Date();
  const [season, teams, events, { rows }, diffs, categories] = await Promise.all([
    getActiveSeason(),
    getTeams(),
    getEvents(),
    getStandings(),
    getDraftDiffs(),
    getCategories(),
  ]);

  const publishedPoints = rows.reduce((sum, r) => sum + r.total, 0);
  const upcoming = events.filter((e) => getComputedEventStatus(e, now) === "upcoming").length;
  const inProgress = events.filter((e) => getComputedEventStatus(e, now) === "ongoing").length;
  const finals = events.filter((e) => getComputedEventStatus(e, now) === "ended").length;

  return {
    season,
    stats: {
      teams: teams.length,
      events: events.length,
      upcoming,
      inProgress,
      finals,
      publishedPoints,
      drafts: diffs.length,
      categories: categories.length,
    },
    diffs,
    activity: events.slice().sort((a, b) => a.start_at.localeCompare(b.start_at)).slice(0, 6),
  };
}

export async function getAdminEvents(): Promise<FairEvent[]> {
  await requireStaff("/admin/events");
  const supabase = await createClient();
  const season = await getActiveSeason();
  if (!season) return [];

  const [categories, teams, { data, error }] = await Promise.all([
    getCategories(season.id),
    getTeams(season.id),
    supabase
      .from("events")
      .select("*")
      .eq("season_id", season.id)
      .eq("is_archived", false)
      .order("start_at"),
  ]);
  if (error) throw new Error(error.message);

  const catById = new Map(categories.map((c) => [c.id, c]));
  const teamById = new Map(teams.map((t) => [t.id, t]));

  return (data ?? []).map((event) => {
    const cat = catById.get(event.category_id);
    return {
      ...event,
      categories: cat ? { id: cat.id, name: cat.name, slug: cat.slug } : null,
      team_a: toTeam(event.team_a_id ? teamById.get(event.team_a_id) : null),
      team_b: toTeam(event.team_b_id ? teamById.get(event.team_b_id) : null),
      winner_team: toTeam(
        event.winner_team_id ? teamById.get(event.winner_team_id) : null,
      ),
    };
  });
}

export async function getAdminTeams() {
  await requireStaff("/admin/teams");
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const season = await getActiveSeason();
  if (!season) return [];

  const { data, error } = await supabase
    .from("competition_teams")
    .select("*")
    .eq("season_id", season.id)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getAccessDirectory() {
  await requireStaff("/admin/access");
  if (!isSupabaseConfigured) return { profiles: [], invites: [] };
  const supabase = await createClient();

  const [{ data: profiles, error: pErr }, { data: invites, error: iErr }] = await Promise.all([
    supabase.from("profiles").select("*").not("role", "is", null).order("created_at"),
    supabase
      .from("admin_invitations")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  if (pErr) throw new Error(pErr.message);
  if (iErr) throw new Error(iErr.message);

  return { profiles: profiles ?? [], invites: invites ?? [] };
}

export async function getAuditLog(filters?: { action?: string; q?: string }) {
  await requireStaff("/admin/leaderboards/history");
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  let q = supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(100);

  if (filters?.action && filters.action !== "all") {
    q = q.eq("action", filters.action as never);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  let rows = data ?? [];
  if (filters?.q) {
    const needle = filters.q.toLowerCase();
    rows = rows.filter((r) => r.summary.toLowerCase().includes(needle));
  }
  return rows.map((row) => ({ ...row, profiles: null as null }));
}

export async function requireOwnerAccess() {
  return requireOwner();
}
