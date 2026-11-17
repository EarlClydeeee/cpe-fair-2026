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
  const [{ categories, rows }, drafts] = await Promise.all([
    getStandings(),
    getDrafts(),
  ]);

  const draftMap = new Map(
    drafts.map((d) => [`${d.team_id}:${d.category_id}` as `${string}:${string}`, d]),
  );

  return { season, categories, rows, drafts, draftMap, user };
}

export async function getDrafts(): Promise<Tables<"score_drafts">[]> {
  await requireStaff();
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("score_drafts")
    .select("*")
    .order("saved_at", { ascending: false });
  if (error) throw new Error(error.message);
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
  const [drafts, teams, categories, { rows }] = await Promise.all([
    getDrafts(),
    getTeams(),
    getCategories(),
    getStandings(),
  ]);
  const preparers = await getPreparersById(drafts);

  const teamById = new Map(teams.map((t) => [t.id, t]));
  const catById = new Map(categories.map((c) => [c.id, c]));
  const publishedByKey = new Map<string, number>();
  for (const row of rows) {
    for (const cat of categories) {
      publishedByKey.set(`${row.team.id}:${cat.id}`, row.byCategory[cat.slug] ?? 0);
    }
  }

  return drafts.flatMap((draft) => {
    const team = teamById.get(draft.team_id);
    const category = catById.get(draft.category_id);
    if (!team || !category) return [];
    const publishedPoints = publishedByKey.get(`${draft.team_id}:${draft.category_id}`) ?? 0;
    return [
      {
        draft,
        team,
        category,
        publishedPoints,
        delta: draft.draft_points - publishedPoints,
        preparedBy: draft.saved_by ? (preparers.get(draft.saved_by) ?? null) : null,
      },
    ];
  });
}

export async function getProjectedStandings(diffs: DraftDiff[]): Promise<ProjectedStandingRow[]> {
  const { rows, categories } = await getStandings();
  const override = new Map(
    diffs.map((d) => [`${d.team.id}:${d.category.slug}`, d.draft.draft_points]),
  );
  const affectedTeams = new Set(diffs.map((d) => d.team.id));

  const publishedByRank = new Map(rows.map((row) => [row.team.id, row.rank]));
  const publishedByTotal = new Map(rows.map((row) => [row.team.id, row.total]));

  const projected = rows.map((row) => {
    const byCategory = { ...row.byCategory };
    for (const cat of categories) {
      const key = `${row.team.id}:${cat.slug}`;
      if (override.has(key)) byCategory[cat.slug] = override.get(key)!;
    }
    const projectedTotal = Object.values(byCategory).reduce((a, b) => a + b, 0);
    const publishedTotal = publishedByTotal.get(row.team.id) ?? row.total;
    const publishedRank = publishedByRank.get(row.team.id) ?? row.rank;
    return {
      ...row,
      byCategory,
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
  const affectedCategories = [...new Set(diffs.map((d) => d.category.name))];
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
      label: `${d.team.name} · ${d.category.name}`,
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
