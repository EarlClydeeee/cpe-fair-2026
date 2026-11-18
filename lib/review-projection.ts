import type { ReviewChangeLine } from "@/lib/review-types";
import type { AdminRole } from "@/lib/roles";

export type ReviewStandingSeed = {
  team: {
    id: string;
    name: string;
    affiliation: string;
    sort_order: number;
  };
  total: number;
  rank: number;
  byCompetition: Record<string, number>;
};

export type ReviewCompetitionSeed = {
  id: string;
  name: string;
  category_id: string;
};

export type ReviewCategorySeed = {
  id: string;
  name: string;
  slug: string;
};

export type ReviewDraftItem = {
  draftId: string;
  teamId: string;
  teamName: string;
  teamAffiliation: string;
  categoryId: string;
  categoryName: string;
  competitionId: string;
  competitionName: string;
  publishedPoints: number;
  draftPoints: number;
  delta: number;
  reason: string;
  preparedByName: string | null;
  preparedByRole: AdminRole | null;
};

export type ProjectedReviewRow = ReviewStandingSeed & {
  publishedTotal: number;
  publishedRank: number;
  projectedTotal: number;
  projectedRank: number;
  rankDelta: number;
  affected: boolean;
};

export type ReviewSummaryView = {
  scoreChangeCount: number;
  scoreChangeSubtitle: string;
  teamsAffected: number;
  teamsAffectedSubtitle: string;
  netDelta: number;
  netPointSubtitle: string;
  rankChangeCount: number;
  rankChangeSubtitle: string;
  changeLines: ReviewChangeLine[];
};

function formatSigned(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toLocaleString("en-US")}`;
}

export function projectReviewStandings(
  rows: ReviewStandingSeed[],
  categories: ReviewCategorySeed[],
  competitions: ReviewCompetitionSeed[],
  drafts: ReviewDraftItem[],
): ProjectedReviewRow[] {
  const override = new Map(
    drafts.map((d) => [`${d.teamId}:${d.competitionId}`, d.draftPoints]),
  );
  const affectedTeams = new Set(drafts.map((d) => d.teamId));
  const compsByCategory = new Map<string, ReviewCompetitionSeed[]>();
  for (const comp of competitions) {
    const list = compsByCategory.get(comp.category_id) ?? [];
    list.push(comp);
    compsByCategory.set(comp.category_id, list);
  }

  const projected = rows.map((row) => {
    const byCompetition = { ...row.byCompetition };
    for (const comp of competitions) {
      const key = `${row.team.id}:${comp.id}`;
      if (override.has(key)) byCompetition[comp.id] = override.get(key)!;
    }

    const projectedTotal = categories.reduce((sum, cat) => {
      const comps = compsByCategory.get(cat.id) ?? [];
      return (
        sum +
        comps.reduce((catSum, c) => catSum + (byCompetition[c.id] ?? 0), 0)
      );
    }, 0);

    return {
      ...row,
      byCompetition,
      publishedTotal: row.total,
      publishedRank: row.rank,
      projectedTotal,
      projectedRank: 0,
      rankDelta: 0,
      affected: affectedTeams.has(row.team.id),
    } satisfies ProjectedReviewRow;
  });

  projected.sort(
    (a, b) =>
      b.projectedTotal - a.projectedTotal ||
      a.team.sort_order - b.team.sort_order,
  );
  projected.forEach((row, i) => {
    row.projectedRank = i + 1;
    row.rankDelta = row.publishedRank - row.projectedRank;
  });

  return projected;
}

export function summarizeReview(
  drafts: ReviewDraftItem[],
  projected: ProjectedReviewRow[],
): ReviewSummaryView {
  const scoreChangeCount = drafts.length;
  const affectedCategories = [
    ...new Set(drafts.map((d) => `${d.categoryName} · ${d.competitionName}`)),
  ];
  const teamMap = new Map<string, { name: string; affiliation: string }>();
  for (const d of drafts) {
    teamMap.set(d.teamId, {
      name: d.teamName,
      affiliation: d.teamAffiliation,
    });
  }
  const teamSubtitles = [...teamMap.values()].map((t) =>
    t.affiliation ? `${t.name} / ${t.affiliation}` : t.name,
  );

  const publishedGrandTotal = projected.reduce((s, r) => s + r.publishedTotal, 0);
  const projectedGrandTotal = projected.reduce((s, r) => s + r.projectedTotal, 0);
  const netDelta = drafts.reduce((s, d) => s + d.delta, 0);

  const rankChangeCount = projected.filter((r) => r.rankDelta !== 0).length;
  const rankChangeSubtitle =
    rankChangeCount === 0
      ? "Overall order remains the same"
      : `${rankChangeCount} team${rankChangeCount === 1 ? "" : "s"} will shift rank`;

  const changeLines: ReviewChangeLine[] = [];

  for (const d of drafts) {
    changeLines.push({
      label: `${d.teamName} · ${d.categoryName} · ${d.competitionName}`,
      detail: `${d.publishedPoints.toLocaleString("en-US")} → ${d.draftPoints.toLocaleString("en-US")} (${formatSigned(d.delta)})`,
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
    scoreChangeSubtitle:
      affectedCategories.length > 0
        ? affectedCategories.join(", ")
        : "No pending drafts",
    teamsAffected: teamMap.size,
    teamsAffectedSubtitle:
      teamSubtitles.length > 0 ? teamSubtitles.join(", ") : "No teams affected",
    netDelta,
    netPointSubtitle: `${publishedGrandTotal.toLocaleString("en-US")} -> ${projectedGrandTotal.toLocaleString("en-US")} total points`,
    rankChangeCount,
    rankChangeSubtitle,
    changeLines,
  };
}
