import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Tables } from "@/lib/supabase/database.types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import { tags } from "./tags";

export type Season = Tables<"seasons">;
export type Category = Tables<"categories">;
export type Competition = Tables<"competitions">;
export type CompetitionTeam = Tables<"competition_teams">;
export type FairEventTeam = Pick<CompetitionTeam, "id" | "name" | "slug" | "color_hex">;

export type FairEvent = Tables<"events"> & {
  categories?: Pick<Category, "id" | "name" | "slug"> | null;
  competitions?: Pick<Competition, "id" | "name" | "slug"> | null;
  team_a?: FairEventTeam | null;
  team_b?: FairEventTeam | null;
  winner_team?: FairEventTeam | null;
};

export type StandingRow = {
  team: CompetitionTeam;
  total: number;
  byCategory: Record<string, number>;
  byCompetition: Record<string, number>;
  toLeader: number;
  rank: number;
};

const NOW = "2026-01-01T00:00:00Z";

export const DEFAULT_SEASON: Season = {
  id: "11111111-1111-1111-1111-111111111111",
  slug: "cpe-fair-2026",
  name: "CPE Fair 2026",
  year: 2026,
  is_active: true,
  created_at: NOW,
  updated_at: NOW,
};

/** No sample taxonomy — admins create categories/competitions/teams. */
export const DEFAULT_CATEGORIES: Category[] = [];
export const DEFAULT_COMPETITIONS: Competition[] = [];
export const DEFAULT_TEAMS: CompetitionTeam[] = [];
export const DEFAULT_STANDINGS: StandingRow[] = [];
export const DEFAULT_EVENTS: FairEvent[] = [];

type Result<T> = { data: T | null; error: { message: string } | null };

async function query<T>(label: string, fallback: T, run: () => PromiseLike<Result<T>>): Promise<T> {
  if (!isSupabaseConfigured) return fallback;
  try {
    const res = await Promise.race([
      run(),
      new Promise<Result<T>>((_, reject) =>
        setTimeout(() => reject(new Error("query timeout")), 3000),
      ),
    ]);
    if (res.error) {
      return fallback;
    }
    return res.data ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getActiveSeason(): Promise<Season | null> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });
  cacheTag(tags.season);

  // Never invent a fake season id when Supabase is configured — that hides live events.
  if (!isSupabaseConfigured) return DEFAULT_SEASON;

  return query("getActiveSeason", null, () =>
    createPublicClient()
      .from("seasons")
      .select("*")
      .eq("is_active", true)
      .order("year", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
}

export async function getCategories(seasonId?: string): Promise<Category[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(tags.season);

  if (!isSupabaseConfigured) return DEFAULT_CATEGORIES;

  const season = seasonId ? { id: seasonId } : await getActiveSeason();
  if (!season) return [];

  const data = await query("getCategories", [] as Category[], () =>
    createPublicClient()
      .from("categories")
      .select("*")
      .eq("season_id", season.id)
      .eq("is_archived", false)
      .order("sort_order"),
  );

  return data;
}

export async function getCompetitions(opts?: {
  seasonId?: string;
  categoryId?: string;
  includeArchived?: boolean;
}): Promise<Competition[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(tags.season);

  if (!isSupabaseConfigured) return DEFAULT_COMPETITIONS;

  const season = opts?.seasonId ? { id: opts.seasonId } : await getActiveSeason();
  if (!season) return [];

  const data = await query("getCompetitions", [] as Competition[], () => {
    let q = createPublicClient()
      .from("competitions")
      .select("*")
      .eq("season_id", season.id)
      .order("sort_order");
    if (opts?.categoryId) q = q.eq("category_id", opts.categoryId);
    if (!opts?.includeArchived) q = q.eq("is_archived", false);
    return q;
  });

  return data;
}

export async function getTeams(seasonId?: string): Promise<CompetitionTeam[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });
  cacheTag(tags.teams);

  if (!isSupabaseConfigured) return DEFAULT_TEAMS;

  const season = seasonId ? { id: seasonId } : await getActiveSeason();
  if (!season) return [];

  return query("getTeams", [] as CompetitionTeam[], () =>
    createPublicClient()
      .from("competition_teams")
      .select("*")
      .eq("season_id", season.id)
      .eq("visibility", "active")
      .order("sort_order"),
  );
}

export async function getTeamBySlug(slug: string): Promise<CompetitionTeam | null> {
  const teams = await getTeams();
  return teams.find((t) => t.slug === slug) ?? null;
}

function mapEventJoins(
  event: Tables<"events">,
  catById: Map<string, Category>,
  teamById: Map<string, CompetitionTeam>,
  compById?: Map<string, Competition>,
): FairEvent {
  const cat = catById.get(event.category_id);
  const comp = compById?.get(event.competition_id);
  const teamA = event.team_a_id ? teamById.get(event.team_a_id) : null;
  const teamB = event.team_b_id ? teamById.get(event.team_b_id) : null;
  const winner = event.winner_team_id ? teamById.get(event.winner_team_id) : null;
  const toTeam = (t: CompetitionTeam | null | undefined): FairEventTeam | null =>
    t ? { id: t.id, name: t.name, slug: t.slug, color_hex: t.color_hex } : null;

  return {
    ...event,
    categories: cat ? { id: cat.id, name: cat.name, slug: cat.slug } : null,
    competitions: comp ? { id: comp.id, name: comp.name, slug: comp.slug } : null,
    team_a: toTeam(teamA),
    team_b: toTeam(teamB),
    winner_team: toTeam(winner),
  };
}

export async function getEvents(filters?: {
  categorySlug?: string;
}): Promise<FairEvent[]> {
  "use cache";
  // Short TTL so guest pages pick up admin creates/edits quickly.
  cacheLife({ stale: 0, revalidate: 15, expire: 60 });
  cacheTag(tags.events);

  if (!isSupabaseConfigured) return DEFAULT_EVENTS;
  const season = await getActiveSeason();
  if (!season) return [];

  const [categories, competitions, teams, rawEvents] = await Promise.all([
    getCategories(season.id),
    getCompetitions({ seasonId: season.id }),
    getTeams(season.id),
    query("getEventsRaw", [] as Tables<"events">[], () =>
      createPublicClient()
        .from("events")
        .select("*")
        .eq("season_id", season.id)
        .eq("is_archived", false)
        .order("start_at"),
    ),
  ]);

  const catById = new Map(categories.map((c) => [c.id, c]));
  const compById = new Map(competitions.map((c) => [c.id, c]));
  const teamById = new Map(teams.map((t) => [t.id, t]));

  let rows: FairEvent[] = rawEvents.map((event) =>
    mapEventJoins(event, catById, teamById, compById),
  );

  if (filters?.categorySlug) {
    rows = rows.filter((e) => e.categories?.slug === filters.categorySlug);
  }
  return rows;
}

export async function getEvent(id: string): Promise<FairEvent | null> {
  "use cache";
  cacheLife({ stale: 0, revalidate: 15, expire: 60 });
  cacheTag(tags.events);

  if (!isSupabaseConfigured) {
    return DEFAULT_EVENTS.find((e) => e.id === id) ?? null;
  }

  const season = await getActiveSeason();
  if (!season) return null;

  const event = await query("getEventById", null, () =>
    createPublicClient()
      .from("events")
      .select("*")
      .eq("id", id)
      .eq("season_id", season.id)
      .eq("is_archived", false)
      .maybeSingle(),
  );
  if (!event) return null;

  const [categories, competitions, teams] = await Promise.all([
    getCategories(season.id),
    getCompetitions({ seasonId: season.id }),
    getTeams(season.id),
  ]);
  const catById = new Map(categories.map((c) => [c.id, c]));
  const compById = new Map(competitions.map((c) => [c.id, c]));
  const teamById = new Map(teams.map((t) => [t.id, t]));
  return mapEventJoins(event, catById, teamById, compById);
}

export async function getEventsForTeam(teamId: string): Promise<FairEvent[]> {
  const events = await getEvents();
  return events
    .filter(
      (event) =>
        event.team_a_id === teamId ||
        event.team_b_id === teamId ||
        event.match_type === "all_teams",
    )
    .sort((a, b) => a.start_at.localeCompare(b.start_at));
}

export type PublicDataSource = "live" | "sample";

export async function getStandings(categorySlug?: string): Promise<{
  categories: Category[];
  competitions: Competition[];
  rows: StandingRow[];
  source: PublicDataSource;
}> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });
  cacheTag(tags.scores, tags.teams, tags.season);

  const [categories, competitions, teams] = await Promise.all([
    getCategories(),
    getCompetitions(),
    getTeams(),
  ]);

  if (!isSupabaseConfigured) {
    return { categories, competitions, rows: [], source: "sample" };
  }

  if (!teams.length) {
    return { categories, competitions, rows: [], source: "live" };
  }

  const scores = await query(
    "getPublishedScores",
    [] as Tables<"published_scores">[],
    () =>
      createPublicClient()
        .from("published_scores")
        .select("*")
        .in(
          "team_id",
          teams.map((t) => t.id),
        ),
  );

  const filterCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : null;
  const catById = new Map(categories.map((c) => [c.id, c]));

  const rows: StandingRow[] = teams.map((team) => {
    const byCategory: Record<string, number> = {};
    const byCompetition: Record<string, number> = {};
    for (const cat of categories) byCategory[cat.slug] = 0;
    for (const comp of competitions) byCompetition[comp.id] = 0;

    for (const score of scores) {
      if (score.team_id !== team.id) continue;
      byCompetition[score.competition_id] =
        (byCompetition[score.competition_id] ?? 0) + score.points;
      const cat = catById.get(score.category_id);
      if (cat) byCategory[cat.slug] = (byCategory[cat.slug] ?? 0) + score.points;
    }

    const total = filterCategory
      ? byCategory[filterCategory.slug] ?? 0
      : Object.values(byCategory).reduce((a, b) => a + b, 0);

    return { team, total, byCategory, byCompetition, toLeader: 0, rank: 0 };
  });

  rows.sort((a, b) => b.total - a.total || a.team.sort_order - b.team.sort_order);
  const leader = rows[0]?.total ?? 0;
  rows.forEach((row, i) => {
    row.rank = i + 1;
    row.toLeader = row.total - leader;
  });

  return { categories, competitions, rows, source: "live" };
}
