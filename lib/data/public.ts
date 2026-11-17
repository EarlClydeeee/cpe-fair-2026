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

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-1", season_id: DEFAULT_SEASON.id, slug: "sports", name: "Sports", sort_order: 1, created_at: NOW, updated_at: NOW },
  { id: "cat-2", season_id: DEFAULT_SEASON.id, slug: "logic-board", name: "Logic & Board", sort_order: 2, created_at: NOW, updated_at: NOW },
  { id: "cat-3", season_id: DEFAULT_SEASON.id, slug: "esports", name: "Esports", sort_order: 3, created_at: NOW, updated_at: NOW },
  { id: "cat-4", season_id: DEFAULT_SEASON.id, slug: "academics", name: "Academics", sort_order: 4, created_at: NOW, updated_at: NOW },
  { id: "cat-5", season_id: DEFAULT_SEASON.id, slug: "talents", name: "Talents", sort_order: 5, created_at: NOW, updated_at: NOW },
  { id: "cat-6", season_id: DEFAULT_SEASON.id, slug: "mini-games", name: "Mini Games", sort_order: 6, created_at: NOW, updated_at: NOW },
  { id: "cat-7", season_id: DEFAULT_SEASON.id, slug: "literacy", name: "Literacy", sort_order: 7, created_at: NOW, updated_at: NOW },
];

export const DEFAULT_TEAMS: CompetitionTeam[] = [
  { id: "33333333-3333-3333-3333-333333333301", season_id: DEFAULT_SEASON.id, name: "Karasuno", slug: "karasuno", affiliation: "Section 2", color_hex: "#FF6B21", sort_order: 1, visibility: "active", artwork_url: "/teams/karasuno.png", created_at: NOW, updated_at: NOW },
  { id: "33333333-3333-3333-3333-333333333302", season_id: DEFAULT_SEASON.id, name: "Nekoma", slug: "nekoma", affiliation: "Section 5", color_hex: "#E11D48", sort_order: 2, visibility: "active", artwork_url: "/teams/nekoma.png", created_at: NOW, updated_at: NOW },
  { id: "33333333-3333-3333-3333-333333333303", season_id: DEFAULT_SEASON.id, name: "Aoba Johsai", slug: "aoba-johsai", affiliation: "Section 7", color_hex: "#14B8A6", sort_order: 3, visibility: "active", artwork_url: "/teams/aoba-johsai.png", created_at: NOW, updated_at: NOW },
  { id: "33333333-3333-3333-3333-333333333304", season_id: DEFAULT_SEASON.id, name: "Inarizaki", slug: "inarizaki", affiliation: "Section 1", color_hex: "#EAB308", sort_order: 4, visibility: "active", artwork_url: "/teams/inarizaki.png", created_at: NOW, updated_at: NOW },
  { id: "33333333-3333-3333-3333-333333333305", season_id: DEFAULT_SEASON.id, name: "Shiratorizawa", slug: "shiratorizawa", affiliation: "Section 6", color_hex: "#A855F7", sort_order: 5, visibility: "active", artwork_url: "/teams/shiratorizawa.png", created_at: NOW, updated_at: NOW },
  { id: "33333333-3333-3333-3333-333333333306", season_id: DEFAULT_SEASON.id, name: "Kamomedai", slug: "kamomedai", affiliation: "Section 3", color_hex: "#3B82F6", sort_order: 6, visibility: "active", artwork_url: "/teams/kamomedai.png", created_at: NOW, updated_at: NOW },
  { id: "33333333-3333-3333-3333-333333333307", season_id: DEFAULT_SEASON.id, name: "Itachiyama Institute", slug: "itachiyama", affiliation: "Section 4", color_hex: "#84CC16", sort_order: 7, visibility: "active", artwork_url: "/teams/itachiyama.png", created_at: NOW, updated_at: NOW },
  { id: "33333333-3333-3333-3333-333333333308", season_id: DEFAULT_SEASON.id, name: "Fukurodani", slug: "fukurodani", affiliation: "Ladderized / Transferees / Shiftees", color_hex: "#94A3B8", sort_order: 8, visibility: "active", artwork_url: "/teams/fukurodani.png", created_at: NOW, updated_at: NOW },
];

export const DEFAULT_STANDINGS: StandingRow[] = [
  { team: DEFAULT_TEAMS[0], total: 1280, byCategory: { sports: 320, "logic-board": 210, esports: 250, academics: 180, talents: 160, "mini-games": 160, literacy: 0 }, toLeader: 0, rank: 1 },
  { team: DEFAULT_TEAMS[1], total: 1150, byCategory: { sports: 280, "logic-board": 200, esports: 240, academics: 170, talents: 140, "mini-games": 120, literacy: 0 }, toLeader: -130, rank: 2 },
  { team: DEFAULT_TEAMS[2], total: 1040, byCategory: { sports: 250, "logic-board": 190, esports: 200, academics: 160, talents: 130, "mini-games": 110, literacy: 0 }, toLeader: -240, rank: 3 },
  { team: DEFAULT_TEAMS[3], total: 980, byCategory: { sports: 230, "logic-board": 180, esports: 190, academics: 150, talents: 120, "mini-games": 110, literacy: 0 }, toLeader: -300, rank: 4 },
  { team: DEFAULT_TEAMS[4], total: 920, byCategory: { sports: 210, "logic-board": 170, esports: 180, academics: 140, talents: 110, "mini-games": 110, literacy: 0 }, toLeader: -360, rank: 5 },
  { team: DEFAULT_TEAMS[5], total: 860, byCategory: { sports: 190, "logic-board": 160, esports: 170, academics: 130, talents: 110, "mini-games": 100, literacy: 0 }, toLeader: -420, rank: 6 },
  { team: DEFAULT_TEAMS[6], total: 790, byCategory: { sports: 180, "logic-board": 150, esports: 150, academics: 120, talents: 100, "mini-games": 90, literacy: 0 }, toLeader: -490, rank: 7 },
  { team: DEFAULT_TEAMS[7], total: 720, byCategory: { sports: 160, "logic-board": 140, esports: 140, academics: 110, talents: 90, "mini-games": 80, literacy: 0 }, toLeader: -560, rank: 8 },
];

export const DEFAULT_EVENTS: FairEvent[] = [
  {
    id: "event-volleyball",
    season_id: DEFAULT_SEASON.id,
    category_id: "cat-1",
    title: "Volleyball",
    venue: "Main Court",
    day_number: 1,
    starts_at: "2026-11-17T14:00:00Z",
    status: "in_progress",
    team_a_id: DEFAULT_TEAMS[0].id,
    team_b_id: DEFAULT_TEAMS[1].id,
    categories: { id: "cat-1", name: "Volleyball", slug: "sports" },
    team_a: { id: DEFAULT_TEAMS[0].id, name: DEFAULT_TEAMS[0].name, slug: DEFAULT_TEAMS[0].slug, color_hex: DEFAULT_TEAMS[0].color_hex },
    team_b: { id: DEFAULT_TEAMS[1].id, name: DEFAULT_TEAMS[1].name, slug: DEFAULT_TEAMS[1].slug, color_hex: DEFAULT_TEAMS[1].color_hex },
    created_at: NOW,
    updated_at: NOW,
    notes: "",
  },
  {
    id: "event-debate",
    season_id: DEFAULT_SEASON.id,
    category_id: "cat-7",
    title: "Debate & Oratorical",
    venue: "Conference Hall",
    day_number: 2,
    starts_at: "2026-11-18T10:00:00Z",
    status: "upcoming",
    team_a_id: null,
    team_b_id: null,
    categories: { id: "cat-7", name: "Literacy", slug: "literacy" },
    team_a: null,
    team_b: null,
    created_at: NOW,
    updated_at: NOW,
    notes: "All eight teams",
  },
];

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

  return query("getActiveSeason", DEFAULT_SEASON, () =>
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
  if (!season) return DEFAULT_CATEGORIES;

  const data = await query("getCategories", [] as Category[], () =>
    createPublicClient()
      .from("categories")
      .select("*")
      .eq("season_id", season.id)
      .order("sort_order"),
  );

  if (data.length) {
    const existingSlugs = new Set(data.map((c) => c.slug));
    const missing = DEFAULT_CATEGORIES.filter((c) => !existingSlugs.has(c.slug));
    return [...data, ...missing].sort((a, b) => a.sort_order - b.sort_order);
  }

  return DEFAULT_CATEGORIES;
}

export async function getTeams(seasonId?: string): Promise<CompetitionTeam[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });
  cacheTag(tags.teams);

  const season = seasonId ? { id: seasonId } : await getActiveSeason();
  if (!season) return DEFAULT_TEAMS;

  const data = await query("getTeams", [] as CompetitionTeam[], () =>
    createPublicClient()
      .from("competition_teams")
      .select("*")
      .eq("season_id", season.id)
      .eq("visibility", "active")
      .order("sort_order"),
  );

  return data.length ? data : DEFAULT_TEAMS;
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

  if (!isSupabaseConfigured) return DEFAULT_EVENTS;
  const season = await getActiveSeason();
  if (!season) return DEFAULT_EVENTS;

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

  if (!rawEvents.length) return DEFAULT_EVENTS;

  const catById = new Map(categories.map((c) => [c.id, c]));
  const teamById = new Map(teams.map((t) => [t.id, t]));

  let rows: FairEvent[] = rawEvents.map((event) =>
    mapEventJoins(event, catById, teamById),
  );

  if (filters?.categorySlug) {
    rows = rows.filter((e) => e.categories?.slug === filters.categorySlug);
  }
  return rows.length ? rows : DEFAULT_EVENTS;
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
    const filteredRows = categorySlug
      ? DEFAULT_STANDINGS.map((row) => ({
          ...row,
          total: row.byCategory[categorySlug] ?? 0,
        }))
          .sort((a, b) => b.total - a.total)
          .map((row, i, arr) => ({
            ...row,
            rank: i + 1,
            toLeader: row.total - (arr[0]?.total ?? 0),
          }))
      : DEFAULT_STANDINGS;
    return { categories, rows: filteredRows };
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

  if (!scores.length) {
    const filteredRows = categorySlug
      ? DEFAULT_STANDINGS.map((row) => ({
          ...row,
          total: row.byCategory[categorySlug] ?? 0,
        }))
          .sort((a, b) => b.total - a.total)
          .map((row, i, arr) => ({
            ...row,
            rank: i + 1,
            toLeader: row.total - (arr[0]?.total ?? 0),
          }))
      : DEFAULT_STANDINGS;
    return { categories, rows: filteredRows };
  }

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
