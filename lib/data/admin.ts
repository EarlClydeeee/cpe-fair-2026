import "server-only";
import { connection } from "next/server";
import { requireOwner, requireStaff } from "@/lib/auth";
import { getComputedEventStatus } from "@/lib/events";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveSeason,
  getCategories,
  getCompetitions,
  getEvents,
  getStandings,
  getTeams,
  type Category,
  type Competition,
  type FairEvent,
} from "./public";
import { ensureActiveSeason } from "./season";
import { getDraftDiffs } from "./standings";

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

  // Admin marked Ended but has not announced a winner yet.
  const unannouncedWinners = events
    .filter(
      (e) =>
        !e.is_archived &&
        e.status_override === "ended" &&
        !e.winner_team_id,
    )
    .sort((a, b) => a.end_at.localeCompare(b.end_at));

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
      unannouncedWinners: unannouncedWinners.length,
    },
    diffs,
    unannouncedWinners,
    activity: events.slice().sort((a, b) => a.start_at.localeCompare(b.start_at)).slice(0, 6),
  };
}

export async function getAdminEvents(): Promise<FairEvent[]> {
  await requireStaff("/admin/events");
  // Reuse the public events cache; admin saves already revalidate tags.events.
  const events = await getEvents();
  return [...events].sort((a, b) => b.start_at.localeCompare(a.start_at));
}

export async function getAdminCategories(): Promise<{
  categories: Category[];
  competitions: Competition[];
}> {
  await requireStaff("/admin/categories");
  if (!isSupabaseConfigured) return { categories: [], competitions: [] };
  const supabase = await createClient();
  const season = (await ensureActiveSeason(supabase)) ?? (await getActiveSeason());
  if (!season) return { categories: [], competitions: [] };

  const [{ data: categories, error: cErr }, { data: competitions, error: pErr }] =
    await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .eq("season_id", season.id)
        .eq("is_archived", false)
        .order("sort_order"),
      supabase
        .from("competitions")
        .select("*")
        .eq("season_id", season.id)
        .eq("is_archived", false)
        .order("sort_order"),
    ]);

  if (cErr) throw new Error(cErr.message);
  if (pErr) throw new Error(pErr.message);
  return { categories: categories ?? [], competitions: competitions ?? [] };
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
  if (error) {
    console.error("[data] getAuditLog:", error.message);
    return [];
  }

  let rows = data ?? [];
  if (filters?.q) {
    const needle = filters.q.toLowerCase();
    rows = rows.filter((r) => r.summary.toLowerCase().includes(needle));
  }
  return rows.map((row) => ({ ...row, profiles: null as null }));
}

export async function getAdminLiveBroadcast() {
  await requireStaff("/admin/live");
  if (!isSupabaseConfigured) {
    return {
      id: null as string | null,
      title: "Live now",
      facebook_url: "",
      is_active: false,
    };
  }

  const supabase = await createClient();
  const season = (await ensureActiveSeason(supabase)) ?? (await getActiveSeason());
  if (!season) {
    return {
      id: null as string | null,
      title: "Live now",
      facebook_url: "",
      is_active: false,
    };
  }

  const { data, error } = await supabase
    .from("live_broadcasts")
    .select("id, title, facebook_url, is_active")
    .eq("season_id", season.id)
    .maybeSingle();

  if (error) {
    console.error("[data] getAdminLiveBroadcast:", error.message);
    return {
      id: null as string | null,
      title: "Live now",
      facebook_url: "",
      is_active: false,
    };
  }

  return {
    id: data?.id ?? null,
    title: data?.title ?? "Live now",
    facebook_url: data?.facebook_url ?? "",
    is_active: data?.is_active ?? false,
  };
}

export async function requireOwnerAccess() {
  return requireOwner();
}
