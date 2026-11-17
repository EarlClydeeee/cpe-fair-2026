import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Tables } from "@/lib/supabase/database.types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import { tags } from "./tags";

export type Season = Tables<"seasons">;
export type Category = Tables<"categories">;
export type CompetitionTeam = Tables<"competition_teams">;
export type FairEventTeam = Pick<CompetitionTeam, "id" | "name" | "slug" | "color_hex">;

export type FairEvent = Tables<"events"> & {
  categories?: Pick<Category, "id" | "name" | "slug"> | null;
  team_a?: FairEventTeam | null;
  team_b?: FairEventTeam | null;
  winner_team?: FairEventTeam | null;
};

export type StandingRow = {
  team: CompetitionTeam;
  total: number;
  byCategory: Record<string, number>;
  toLeader: number;
  rank: number;
};

type Result<T> = { data: T | null; error: { message: string } | null };

async function query<T>(label: string, fallback: T, run: () => PromiseLike<Result<T>>): Promise<T> {
  if (!isSupabaseConfigured) return fallback;
  try {
    const { data, error } = await run();
    if (error) {
      console.error(`[data] ${label}: ${error.message}`);
      return fallback;
    }
    return data ?? fallback;
  } catch (err) {
    console.error(`[data] ${label}:`, err);
    return fallback;
  }
}

export async function getActiveSeason(): Promise<Season | null> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });
  cacheTag(tags.season);

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

  const season = seasonId ? { id: seasonId } : await getActiveSeason();
  if (!season) return [];

  return query("getCategories", [], () =>
    createPublicClient()
      .from("categories")
      .select("*")
      .eq("season_id", season.id)
      .order("sort_order"),
  );
}

export async function getTeams(seasonId?: string): Promise<CompetitionTeam[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });
  cacheTag(tags.teams);

  const season = seasonId ? { id: seasonId } : await getActiveSeason();
  if (!season) return [];

  return query("getTeams", [], () =>
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
): FairEvent {
  const cat = catById.get(event.category_id);
  const teamA = event.team_a_id ? teamById.get(event.team_a_id) : null;
  const teamB = event.team_b_id ? teamById.get(event.team_b_id) : null;
  const winner = event.winner_team_id ? teamById.get(event.winner_team_id) : null;
  const toTeam = (t: CompetitionTeam | null | undefined): FairEventTeam | null =>
    t ? { id: t.id, name: t.name, slug: t.slug, color_hex: t.color_hex } : null;

  return {
    ...event,
    categories: cat ? { id: cat.id, name: cat.name, slug: cat.slug } : null,
    team_a: toTeam(teamA),
    team_b: toTeam(teamB),
    winner_team: toTeam(winner),
  };
}

export async function getEvents(filters?: {
  categorySlug?: string;
}): Promise<FairEvent[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(tags.events);

  if (!isSupabaseConfigured) return [];
  const season = await getActiveSeason();
  if (!season) return [];

  const [categories, teams, rawEvents] = await Promise.all([
    getCategories(season.id),
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
  const teamById = new Map(teams.map((t) => [t.id, t]));

  let rows: FairEvent[] = rawEvents.map((event) =>
    mapEventJoins(event, catById, teamById),
  );

  if (filters?.categorySlug) {
    rows = rows.filter((e) => e.categories?.slug === filters.categorySlug);
  }
  return rows;
}

export async function getEvent(id: string): Promise<FairEvent | null> {
  const events = await getEvents();
  return events.find((e) => e.id === id) ?? null;
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

export async function getStandings(categorySlug?: string): Promise<{
  categories: Category[];
  rows: StandingRow[];
}> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });
  cacheTag(tags.scores, tags.teams);

  const [categories, teams] = await Promise.all([getCategories(), getTeams()]);
  if (!isSupabaseConfigured || !teams.length) {
    return { categories, rows: [] };
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

  const categoryIds = new Set(categories.map((c) => c.id));
  const filterCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : null;

  const rows: StandingRow[] = teams.map((team) => {
    const byCategory: Record<string, number> = {};
    for (const cat of categories) byCategory[cat.slug] = 0;

    for (const score of scores) {
      if (score.team_id !== team.id || !categoryIds.has(score.category_id)) continue;
      const cat = categories.find((c) => c.id === score.category_id);
      if (!cat) continue;
      byCategory[cat.slug] = score.points;
    }

    const total = filterCategory
      ? byCategory[filterCategory.slug] ?? 0
      : Object.values(byCategory).reduce((a, b) => a + b, 0);

    return { team, total, byCategory, toLeader: 0, rank: 0 };
  });

  rows.sort((a, b) => b.total - a.total || a.team.sort_order - b.team.sort_order);
  const leader = rows[0]?.total ?? 0;
  rows.forEach((row, i) => {
    row.rank = i + 1;
    row.toLeader = row.total - leader;
  });

  return { categories, rows };
}
