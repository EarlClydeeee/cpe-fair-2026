import "server-only";
import { requireOwner, requireStaff } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getActiveSeason, getCategories, getEvents, getStandings, getTeams } from "./public";
import { getDraftDiffs } from "./standings";

export async function getOverview() {
  await requireStaff("/admin");
  const [season, teams, events, { rows }, diffs, categories] = await Promise.all([
    getActiveSeason(),
    getTeams(),
    getEvents(),
    getStandings(),
    getDraftDiffs(),
    getCategories(),
  ]);

  const publishedPoints = rows.reduce((sum, r) => sum + r.total, 0);
  const upcoming = events.filter((e) => e.status === "upcoming").length;
  const inProgress = events.filter((e) => e.status === "in_progress").length;
  const finals = events.filter((e) => e.status === "final").length;

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
    activity: events.slice().sort((a, b) => a.starts_at.localeCompare(b.starts_at)).slice(0, 6),
  };
}

export async function getAdminEvents() {
  await requireStaff("/admin/events");
  return getEvents();
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
