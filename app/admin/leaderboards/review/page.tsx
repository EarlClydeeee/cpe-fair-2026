import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { LeaderboardNav } from "@/components/admin/leaderboard-nav";
import { ReviewBoard } from "@/components/admin/review-board";
import { canScore, requireStaff } from "@/lib/auth";
import { getDraftDiffs } from "@/lib/data/standings";
import { getStandings } from "@/lib/data/public";

export const metadata: Metadata = { title: "Review & publish" };
export const instant = false;

async function ReviewPublishContent() {
  await connection();
  const user = await requireStaff("/admin/leaderboards/review");
  const [diffs, { rows, categories, competitions }] = await Promise.all([
    getDraftDiffs(),
    getStandings(),
  ]);
  const mayPublish = canScore(user.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.18em] text-accent uppercase">
            Confirm before the public board updates
          </p>
          <h1 className="mt-2 font-display text-3xl leading-none sm:text-5xl">
            Review & publish
          </h1>
          <p className="mt-2 text-sm text-muted">
            Choose which saved drafts to publish. Unchecked drafts stay in review.
          </p>
        </div>
      </div>

      <LeaderboardNav draftCount={diffs.length} />

      <ReviewBoard
        canPublish={mayPublish}
        drafts={diffs.map((diff) => ({
          draftId: diff.draft.id,
          teamId: diff.team.id,
          teamName: diff.team.name,
          teamAffiliation: diff.team.affiliation,
          categoryId: diff.category.id,
          categoryName: diff.category.name,
          competitionId: diff.competition.id,
          competitionName: diff.competition.name,
          publishedPoints: diff.publishedPoints,
          draftPoints: diff.draft.draft_points,
          delta: diff.delta,
          reason: diff.draft.reason ?? "",
          preparedByName: diff.preparedBy?.full_name ?? null,
          preparedByRole: diff.preparedBy?.role ?? null,
        }))}
        standingRows={rows.map((row) => ({
          team: {
            id: row.team.id,
            name: row.team.name,
            affiliation: row.team.affiliation,
            sort_order: row.team.sort_order,
          },
          total: row.total,
          rank: row.rank,
          byCompetition: row.byCompetition,
        }))}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
        }))}
        competitions={competitions.map((c) => ({
          id: c.id,
          name: c.name,
          category_id: c.category_id,
        }))}
      />
    </div>
  );
}

export default function ReviewPublishPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
          Loading review…
        </div>
      }
    >
      <ReviewPublishContent />
    </Suspense>
  );
}
