import "server-only";
import { requireStaff } from "@/lib/auth";
import type { AdminRole } from "@/lib/roles";
import type { ReviewChangeLine } from "@/lib/review-types";
import type { Tables } from "@/lib/supabase/database.types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveSeason,
  getCategories,
  getCompetitions,
  getStandings,
  getTeams,
  type StandingRow,
} from "./public";

export type { ReviewChangeLine } from "@/lib/review-types";

export type DraftPreparer = {
  id: string;
  full_name: string;
  role: AdminRole | null;
};

export type DraftDiff = {
  draft: Tables<"score_drafts">;
  team: Tables<"competition_teams">;
  category: Tables<"categories">;
  competition: Tables<"competitions">;
  publishedPoints: number;
  delta: number;
  preparedBy: DraftPreparer | null;
};

export type ProjectedStandingRow = StandingRow & {
  publishedTotal: number;
  publishedRank: number;
  projectedTotal: number;
  projectedRank: number;
  rankDelta: number;
  affected: boolean;
};

export type ReviewSummary = {
  scoreChangeCount: number;
  affectedCategories: string[];
  scoreChangeSubtitle: string;
  teamsAffected: number;
  teamSubtitles: string[];
  teamsAffectedSubtitle: string;
  netDelta: number;
  publishedGrandTotal: number;
  projectedGrandTotal: number;
  netPointSubtitle: string;
  rankChangeCount: number;
  rankChangeSubtitle: string;
  changeLines: ReviewChangeLine[];
};

export async function getScoreMatrix() {
  const user = await requireStaff("/admin/leaderboards");

  const season = await getActiveSeason();
  const [{ categories, competitions, rows }, rawDrafts, teams] =
    await Promise.all([getStandings(), getDrafts(), getTeams()]);

  // EVENT ONLY categories (include_in_scoring = false) stay scoreable and
  // get their own leaderboard filter; Overall totals still exclude them.

  // Only count drafts that can actually be reviewed (valid team + competition).
  const teamIds = new Set(teams.map((t) => t.id));
  const competitionIds = new Set(competitions.map((c) => c.id));
  const drafts = rawDrafts.filter(
    (d) => teamIds.has(d.team_id) && competitionIds.has(d.competition_id),
  );

  const draftMap = new Map(
    drafts.map((d) => [`${d.team_id}:${d.competition_id}` as `${string}:${string}`, d]),
  );

  return { season, categories, competitions, rows, drafts, draftMap, user };
}

export async function getDrafts(): Promise<Tables<"score_drafts">[]> {
  await requireStaff();
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("score_drafts")
    .select("*")
    .order("saved_at", { ascending: false });
  if (error) {
    console.error("[data] getDrafts:", error.message);
    return [];
  }
  return data ?? [];
}

async function getPreparersById(
  drafts: Tables<"score_drafts">[],
): Promise<Map<string, DraftPreparer>> {
  const ids = [...new Set(drafts.map((d) => d.saved_by).filter(Boolean))] as string[];
  if (ids.length === 0) return new Map();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("id", ids);
  if (error) throw new Error(error.message);

  return new Map(
    (data ?? []).map((p) => [
      p.id,
      { id: p.id, full_name: p.full_name, role: p.role },
    ]),
  );
}

export async function getDraftDiffs(): Promise<DraftDiff[]> {
  const [drafts, teams, categories, competitions, { rows }] = await Promise.all([
    getDrafts(),
    getTeams(),
    getCategories(),
    // Match score matrix: only active competitions count toward review.
    getCompetitions(),
    getStandings(),
  ]);
  const preparers = await getPreparersById(drafts);

  const teamById = new Map(teams.map((t) => [t.id, t]));
  const catById = new Map(categories.map((c) => [c.id, c]));
  const compById = new Map(competitions.map((c) => [c.id, c]));

  return drafts.flatMap((draft) => {
    const team = teamById.get(draft.team_id);
    const competition = compById.get(draft.competition_id);
    const category =
      (competition ? catById.get(competition.category_id) : undefined) ??
      catById.get(draft.category_id);
    if (!team || !competition || !category) {
      return [];
    }
    const publishedRow = rows.find((r) => r.team.id === draft.team_id);
    const publishedPoints = publishedRow?.byCompetition[draft.competition_id] ?? 0;
    return [
      {
        draft,
        team,
        category,
        competition,
        publishedPoints,
        delta: draft.draft_points - publishedPoints,
        preparedBy: draft.saved_by ? (preparers.get(draft.saved_by) ?? null) : null,
      },
    ];
  });
}

export async function getProjectedStandings(diffs: DraftDiff[]): Promise<ProjectedStandingRow[]> {
  const { rows, categories, competitions } = await getStandings();
  const override = new Map(
    diffs.map((d) => [`${d.team.id}:${d.competition.id}`, d.draft.draft_points]),
  );
  const affectedTeams = new Set(diffs.map((d) => d.team.id));
  const compsByCategory = new Map<string, typeof competitions>();
  for (const comp of competitions) {
    const list = compsByCategory.get(comp.category_id) ?? [];
    list.push(comp);
    compsByCategory.set(comp.category_id, list);
  }

  const publishedByRank = new Map(rows.map((row) => [row.team.id, row.rank]));
  const publishedByTotal = new Map(rows.map((row) => [row.team.id, row.total]));

  const projected = rows.map((row) => {
    const byCompetition = { ...row.byCompetition };
    for (const comp of competitions) {
      const key = `${row.team.id}:${comp.id}`;
      if (override.has(key)) byCompetition[comp.id] = override.get(key)!;
    }

    const byCategory: Record<string, number> = {};
    for (const cat of categories) {
      const comps = compsByCategory.get(cat.id) ?? [];
      byCategory[cat.slug] = comps.reduce(
        (sum, c) => sum + (byCompetition[c.id] ?? 0),
        0,
      );
    }

    const projectedTotal = categories
      .filter((c) => c.include_in_scoring)
      .reduce((sum, c) => sum + (byCategory[c.slug] ?? 0), 0);
    const publishedTotal = publishedByTotal.get(row.team.id) ?? row.total;
    const publishedRank = publishedByRank.get(row.team.id) ?? row.rank;
    return {
      ...row,
      byCategory,
      byCompetition,
      total: projectedTotal,
      projectedTotal,
      publishedTotal,
      publishedRank,
      projectedRank: 0,
      rankDelta: 0,
      affected: affectedTeams.has(row.team.id),
    } satisfies ProjectedStandingRow;
  });

  projected.sort(
    (a, b) => b.projectedTotal - a.projectedTotal || a.team.sort_order - b.team.sort_order,
  );
  const leader = projected[0]?.projectedTotal ?? 0;
  projected.forEach((row, i) => {
    row.rank = i + 1;
    row.projectedRank = i + 1;
    row.toLeader = row.projectedTotal - leader;
    row.rankDelta = row.publishedRank - row.projectedRank;
  });

  return projected;
}

function formatSigned(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toLocaleString("en-US")}`;
}

export function getReviewSummary(
  diffs: DraftDiff[],
  projected: ProjectedStandingRow[],
): ReviewSummary {
  const scoreChangeCount = diffs.length;
  const affectedCategories = [
    ...new Set(diffs.map((d) => `${d.category.name} · ${d.competition.name}`)),
  ];
  const teamMap = new Map<string, { name: string; affiliation: string }>();
  for (const d of diffs) {
    teamMap.set(d.team.id, { name: d.team.name, affiliation: d.team.affiliation });
  }
  const teamSubtitles = [...teamMap.values()].map((t) =>
    t.affiliation ? `${t.name} / ${t.affiliation}` : t.name,
  );

  const publishedGrandTotal = projected.reduce((s, r) => s + r.publishedTotal, 0);
  const projectedGrandTotal = projected.reduce((s, r) => s + r.projectedTotal, 0);
  const netDelta = diffs.reduce((s, d) => s + d.delta, 0);

  const rankChangeCount = projected.filter((r) => r.rankDelta !== 0).length;
  const rankChangeSubtitle =
    rankChangeCount === 0
      ? "Overall order remains the same"
      : `${rankChangeCount} team${rankChangeCount === 1 ? "" : "s"} will shift rank`;

  const changeLines: ReviewChangeLine[] = [];

  for (const d of diffs) {
    changeLines.push({
      label: `${d.team.name} · ${d.category.name} · ${d.competition.name}`,
      detail: `${d.publishedPoints.toLocaleString("en-US")} → ${d.draft.draft_points.toLocaleString("en-US")} (${formatSigned(d.delta)})`,
    });
  }

  for (const row of projected.filter((r) => r.affected)) {
    const teamDelta = row.projectedTotal - row.publishedTotal;
    changeLines.push({
      label: `${row.team.name} overall`,
      detail: `${row.publishedTotal.toLocaleString("en-US")} → ${row.projectedTotal.toLocaleString("en-US")} (${formatSigned(teamDelta)})`,
    });
  }

  changeLines.push({
    label: "Global published total",
    detail: `${publishedGrandTotal.toLocaleString("en-US")} → ${projectedGrandTotal.toLocaleString("en-US")} (${formatSigned(netDelta)})`,
  });

  return {
    scoreChangeCount,
    affectedCategories,
    scoreChangeSubtitle:
      affectedCategories.length > 0 ? affectedCategories.join(", ") : "No pending drafts",
    teamsAffected: teamMap.size,
    teamSubtitles,
    teamsAffectedSubtitle:
      teamSubtitles.length > 0 ? teamSubtitles.join(", ") : "No teams affected",
    netDelta,
    publishedGrandTotal,
    projectedGrandTotal,
    netPointSubtitle: `${publishedGrandTotal.toLocaleString("en-US")} -> ${projectedGrandTotal.toLocaleString("en-US")} total points`,
    rankChangeCount,
    rankChangeSubtitle,
    changeLines,
  };
}
