"use client";

import { useMemo, useState } from "react";
import { DraftDiffCard } from "@/components/admin/draft-diff-card";
import { PublishForm } from "@/components/admin/publish-form";
import { formatPoints } from "@/lib/format";
import {
  projectReviewStandings,
  summarizeReview,
  type ReviewCategorySeed,
  type ReviewCompetitionSeed,
  type ReviewDraftItem,
  type ReviewStandingSeed,
} from "@/lib/review-projection";

function rankArrow(rankDelta: number) {
  if (rankDelta > 0) return { symbol: "↑", className: "text-accent" };
  if (rankDelta < 0) return { symbol: "↓", className: "text-danger" };
  return null;
}

export function ReviewBoard({
  drafts,
  standingRows,
  categories,
  competitions,
  canPublish,
}: {
  drafts: ReviewDraftItem[];
  standingRows: ReviewStandingSeed[];
  categories: ReviewCategorySeed[];
  competitions: ReviewCompetitionSeed[];
  canPublish: boolean;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    drafts.map((d) => d.draftId),
  );

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedDrafts = useMemo(
    () => drafts.filter((d) => selectedSet.has(d.draftId)),
    [drafts, selectedSet],
  );

  const projected = useMemo(
    () =>
      projectReviewStandings(
        standingRows,
        categories,
        competitions,
        selectedDrafts,
      ),
    [standingRows, categories, competitions, selectedDrafts],
  );
  const summary = useMemo(
    () => summarizeReview(selectedDrafts, projected),
    [selectedDrafts, projected],
  );

  const allSelected =
    drafts.length > 0 && selectedIds.length === drafts.length;
  const noneSelected = selectedIds.length === 0;

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

  function setDraftSelected(draftId: string, selected: boolean) {
    setSelectedIds((prev) => {
      if (selected) {
        return prev.includes(draftId) ? prev : [...prev, draftId];
      }
      return prev.filter((id) => id !== draftId);
    });
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-[10px] tracking-wide text-muted uppercase">
              {kpi.label}
            </p>
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
          {drafts.length > 0 ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted">
                  {selectedIds.length} of {drafts.length} draft
                  {drafts.length === 1 ? "" : "s"} selected for publish
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={allSelected}
                    onClick={() => setSelectedIds(drafts.map((d) => d.draftId))}
                    className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-accent disabled:opacity-40"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    disabled={noneSelected}
                    onClick={() => setSelectedIds([])}
                    className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-accent disabled:opacity-40"
                  >
                    Clear selection
                  </button>
                </div>
              </div>

              {drafts.map((diff) => (
                <DraftDiffCard
                  key={diff.draftId}
                  draftId={diff.draftId}
                  teamName={diff.teamName}
                  categoryName={diff.categoryName}
                  competitionName={diff.competitionName}
                  publishedPoints={diff.publishedPoints}
                  draftPoints={diff.draftPoints}
                  delta={diff.delta}
                  reason={diff.reason}
                  preparedByName={diff.preparedByName}
                  preparedByRole={diff.preparedByRole}
                  selected={selectedSet.has(diff.draftId)}
                  onSelectedChange={(selected) =>
                    setDraftSelected(diff.draftId, selected)
                  }
                />
              ))}
            </>
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
              No drafts to publish.
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="border-b border-border px-4 py-3 text-[10px] tracking-wide text-muted uppercase">
              Projected overall standings
              {selectedIds.length < drafts.length
                ? " · based on selected drafts"
                : ""}
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
                      <span
                        className={`ml-1 ${arrow.className}`}
                        aria-label="rank shift"
                      >
                        {arrow.symbol}
                      </span>
                    ) : null}
                  </span>
                  <span>{row.team.name}</span>
                  <span className="text-muted">
                    {formatPoints(row.publishedTotal)}
                  </span>
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
          draftIds={selectedDrafts.map((d) => d.draftId)}
          changeLines={summary.changeLines}
          canPublish={canPublish}
        />
      </div>
    </>
  );
}
