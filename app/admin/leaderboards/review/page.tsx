import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { DraftDiffCard } from "@/components/admin/draft-diff-card";
import { LeaderboardNav } from "@/components/admin/leaderboard-nav";
import { PublishForm } from "@/components/admin/publish-form";
import { canScore, requireStaff } from "@/lib/auth";
import {
  getDraftDiffs,
  getProjectedStandings,
  getReviewSummary,
} from "@/lib/data/standings";
import { formatPoints } from "@/lib/format";

export const metadata: Metadata = { title: "Review & publish" };

function rankArrow(rankDelta: number) {
  if (rankDelta > 0) return { symbol: "↑", className: "text-accent" };
  if (rankDelta < 0) return { symbol: "↓", className: "text-danger" };
  return null;
}

async function ReviewPublishContent() {
  await connection();
  const user = await requireStaff("/admin/leaderboards/review");
  const diffs = await getDraftDiffs();
  const projected = await getProjectedStandings(diffs);
  const summary = getReviewSummary(diffs, projected);
  const mayPublish = canScore(user.role);

  const kpis = [
    {
      label: "Score change",
      value: String(summary.scoreChangeCount).padStart(2, "0"),
      subtitle: summary.scoreChangeSubtitle,
      accent: summary.scoreChangeCount > 0,
    },
    {
      label: "Team affected",
      value: String(summary.teamsAffected).padStart(2, "0"),
      subtitle: summary.teamsAffectedSubtitle,
      accent: summary.teamsAffected > 0,
    },
    {
      label: "Net point change",
      value: `${summary.netDelta >= 0 ? "+" : ""}${summary.netDelta}`,
      subtitle: summary.netPointSubtitle,
      accent: summary.netDelta !== 0,
    },
    {
      label: "Rank changes",
      value: String(summary.rankChangeCount).padStart(2, "0"),
      subtitle: summary.rankChangeSubtitle,
      accent: summary.rankChangeCount > 0,
    },
  ];

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
            This is step 2. Confirm the impact, then publish. Use the steps above to go back to scores or on to history.
          </p>
        </div>
      </div>

      <LeaderboardNav draftCount={diffs.length} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-[10px] tracking-wide text-muted uppercase">{kpi.label}</p>
            <p
              className={`mt-1 font-display text-3xl ${kpi.accent ? "text-accent" : ""}`}
            >
              {kpi.value}
            </p>
            <p className="mt-2 text-xs text-muted">{kpi.subtitle}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-4">
          {diffs.length > 0 ? (
            diffs.map((diff) => (
              <DraftDiffCard
                key={diff.draft.id}
                draftId={diff.draft.id}
                teamName={diff.team.name}
                categoryName={diff.category.name}
                competitionName={diff.competition.name}
                publishedPoints={diff.publishedPoints}
                draftPoints={diff.draft.draft_points}
                delta={diff.delta}
                reason={diff.draft.reason}
                preparedByName={diff.preparedBy?.full_name ?? null}
                preparedByRole={diff.preparedBy?.role ?? null}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
              No drafts to publish.
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="border-b border-border px-4 py-3 text-[10px] tracking-wide text-muted uppercase">
              Projected overall standings
            </div>
            <div className="grid grid-cols-[56px_1.4fr_1fr_1fr] gap-2 border-b border-border px-4 py-2 text-[10px] tracking-wide text-muted uppercase">
              <span>Rank</span>
              <span>Team</span>
              <span>Published</span>
              <span>After publishing</span>
            </div>
            {projected.map((row) => {
              const arrow = rankArrow(row.rankDelta);
              return (
                <div
                  key={row.team.id}
                  className={`grid grid-cols-[56px_1.4fr_1fr_1fr] gap-2 border-b border-border/60 px-4 py-3 text-sm ${
                    row.affected ? "bg-accent-soft" : ""
                  }`}
                >
                  <span className="font-mono text-muted">
                    {String(row.projectedRank).padStart(2, "0")}
                    {arrow ? (
                      <span className={`ml-1 ${arrow.className}`} aria-label="rank shift">
                        {arrow.symbol}
                      </span>
                    ) : null}
                  </span>
                  <span>{row.team.name}</span>
                  <span className="text-muted">{formatPoints(row.publishedTotal)}</span>
                  <span
                    className={`font-display text-lg ${row.affected ? "text-accent" : ""}`}
                  >
                    {formatPoints(row.projectedTotal)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <PublishForm
          draftIds={diffs.map((d) => d.draft.id)}
          changeLines={summary.changeLines}
          canPublish={mayPublish}
        />
      </div>
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
