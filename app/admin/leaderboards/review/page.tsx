import type { Metadata } from "next";
import { PublishForm } from "@/components/admin/publish-form";
import { LinkButton } from "@/components/ui/button";
import { getDraftDiffs, getProjectedStandings } from "@/lib/data/standings";
import { formatPoints } from "@/lib/format";

export const metadata: Metadata = { title: "Review & publish" };

export default async function ReviewPublishPage() {
  const diffs = await getDraftDiffs();
  const projected = await getProjectedStandings(diffs);
  const net = diffs.reduce((s, d) => s + d.delta, 0);
  const first = diffs[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.18em] text-accent uppercase">
            Confirm before the public board updates
          </p>
          <h1 className="mt-2 font-display text-5xl">Review & Publish</h1>
          <p className="mt-2 text-sm text-muted">
            Confirm the score change and its impact before updating the public leaderboard.
          </p>
        </div>
        <LinkButton href="/admin/leaderboards" variant="secondary">
          Back to scores
        </LinkButton>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Score change", String(diffs.length).padStart(2, "0")],
          ["Team affected", String(new Set(diffs.map((d) => d.team.id)).size).padStart(2, "0")],
          ["Net point change", `${net >= 0 ? "+" : ""}${net}`],
          ["Rank changes", "00"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-[10px] tracking-wide text-muted uppercase">{label}</p>
            <p className="mt-1 font-display text-3xl">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-4">
          {first ? (
            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="text-xs text-muted">
                {first.team.name} / {first.category.name} / Saved draft
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <p className="text-[10px] tracking-wide text-muted uppercase">Published</p>
                  <p className="mt-2 font-display text-4xl">{first.publishedPoints}</p>
                </div>
                <div className="rounded-xl border border-accent/40 bg-accent-soft p-4">
                  <p className="text-[10px] tracking-wide text-accent uppercase">Draft</p>
                  <p className="mt-2 font-display text-4xl text-accent">{first.draft.draft_points}</p>
                  <p className="mt-1 text-xs text-accent">
                    {first.delta >= 0 ? "+" : ""}
                    {first.delta} points
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted">{first.draft.reason || "No reason recorded."}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
              No drafts to publish.
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="border-b border-border px-4 py-3 text-[10px] tracking-wide text-muted uppercase">
              Projected overall standings
            </div>
            {projected.map((row) => (
              <div
                key={row.team.id}
                className={`grid grid-cols-[56px_1.4fr_1fr_1fr] gap-2 border-b border-border/60 px-4 py-3 text-sm ${
                  diffs.some((d) => d.team.id === row.team.id) ? "bg-accent-soft" : ""
                }`}
              >
                <span className="font-mono text-muted">{String(row.rank).padStart(2, "0")}</span>
                <span>{row.team.name}</span>
                <span className="text-muted">
                  {formatPoints(
                    // published total approximated from projected minus draft deltas for this team
                    row.total -
                      diffs
                        .filter((d) => d.team.id === row.team.id)
                        .reduce((s, d) => s + d.delta, 0),
                  )}
                </span>
                <span className="font-display text-lg">{formatPoints(row.total)}</span>
              </div>
            ))}
          </div>
        </div>

        <PublishForm draftIds={diffs.map((d) => d.draft.id)} />
      </div>
    </div>
  );
}
