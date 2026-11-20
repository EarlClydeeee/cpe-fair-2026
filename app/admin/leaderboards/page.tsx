import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { LeaderboardNav } from "@/components/admin/leaderboard-nav";
import { ScorePanel } from "@/components/admin/score-panel";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { getAuditLog } from "@/lib/data/admin";
import { getScoreMatrix } from "@/lib/data/standings";
import { formatDateTime, formatPoints } from "@/lib/format";

export const metadata: Metadata = { title: "Scores" };
export const instant = false;

type Props = {
  searchParams: Promise<{
    team?: string;
    category?: string;
    competition?: string;
  }>;
};

async function LeaderboardsContent({ searchParams }: Props) {
  await connection();
  const {
    team: teamId,
    category: categoryId,
    competition: competitionId,
  } = await searchParams;
  const { categories, competitions, rows, drafts, draftMap } =
    await getScoreMatrix();
  const recent = await getAuditLog();

  const matrixRows = rows
    .map((row) => {
      const byCategory = Object.fromEntries(
        categories.map((c) => {
          const comps = competitions.filter((comp) => comp.category_id === c.id);
          const points = comps.reduce((sum, comp) => {
            const key = `${row.team.id}:${comp.id}` as `${string}:${string}`;
            const draft = draftMap.get(key);
            return (
              sum +
              (draft ? draft.draft_points : (row.byCompetition[comp.id] ?? 0))
            );
          }, 0);
          return [c.slug, points];
        }),
      ) as Record<string, number>;
      // Overall column matches public Overall (scoring categories only).
      const total = categories
        .filter((c) => c.include_in_scoring)
        .reduce((sum, c) => sum + (byCategory[c.slug] ?? 0), 0);
      return { ...row, byCategory, total };
    })
    .sort((a, b) => b.total - a.total || a.team.sort_order - b.team.sort_order)
    .map((row, index) => ({ ...row, rank: index + 1 }));

  const selectedTeam =
    matrixRows.find((r) => r.team.id === teamId)?.team ?? matrixRows[0]?.team;
  const selectedCategory =
    categories.find((c) => c.id === categoryId) ?? categories[0];
  const compsInCategory = competitions.filter(
    (c) => c.category_id === selectedCategory?.id,
  );
  const selectedCompetition =
    compsInCategory.find((c) => c.id === competitionId) ?? compsInCategory[0];

  const draft =
    selectedTeam && selectedCompetition
      ? draftMap.get(
          `${selectedTeam.id}:${selectedCompetition.id}` as `${string}:${string}`,
        )
      : undefined;
  const publishedSource = selectedTeam
    ? rows.find((r) => r.team.id === selectedTeam.id)
    : undefined;
  const publishedPoints =
    publishedSource && selectedCompetition
      ? (publishedSource.byCompetition[selectedCompetition.id] ?? 0)
      : 0;
  const publishedTeamTotal = publishedSource?.total ?? 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl leading-none sm:text-5xl">
            Scores
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Pick a cell, edit the draft, then continue to review before it goes
            public. Matrix shows category rollups from competition scores.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <LinkButton
            href="/api/admin/scores/export"
            variant="secondary"
            className="min-h-11"
          >
            Export
          </LinkButton>
          <LinkButton href="/admin/leaderboards/review" className="min-h-11">
            Next: Review ({drafts.length})
          </LinkButton>
        </div>
      </div>

      <LeaderboardNav draftCount={drafts.length} />

      <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:grid-cols-4 sm:gap-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            ["Teams", String(matrixRows.length).padStart(2, "0")],
            ["Categories", String(categories.length).padStart(2, "0")],
            [
              "Draft matrix total",
              formatPoints(matrixRows.reduce((s, r) => s + r.total, 0)),
            ],
            ["Saved draft", String(drafts.length).padStart(2, "0")],
          ].map(([label, value]) => (
            <div
              key={label}
              className="min-w-[9.5rem] shrink-0 rounded-xl border border-border bg-surface p-3.5 sm:min-w-0 sm:shrink sm:p-4"
            >
              <p className="text-[10px] tracking-wide text-muted uppercase">
                {label}
              </p>
              <p className="mt-1 font-display text-2xl sm:text-3xl">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_0.9fr]">
        {selectedTeam && selectedCategory && selectedCompetition ? (
          <div className="xl:order-2">
            <ScorePanel
              key={`${selectedTeam.id}-${selectedCompetition.id}`}
              teams={matrixRows.map((r) => ({
                id: r.team.id,
                name: r.team.name,
              }))}
              categories={categories.map((c) => ({
                id: c.id,
                name: c.name,
                include_in_scoring: c.include_in_scoring,
              }))}
              competitions={competitions.map((c) => ({
                id: c.id,
                name: c.name,
                category_id: c.category_id,
              }))}
              selectedTeamId={selectedTeam.id}
              selectedCategoryId={selectedCategory.id}
              selectedCompetitionId={selectedCompetition.id}
              publishedPoints={publishedPoints}
              teamTotal={publishedTeamTotal}
              draftPoints={draft?.draft_points}
              draftId={draft?.id}
              reason={draft?.reason ?? ""}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted xl:order-2">
            Create categories and competitions under{" "}
            <Link href="/admin/categories" className="text-accent">
              Categories
            </Link>{" "}
            to start scoring.
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-border bg-surface xl:order-1">
          {categories.length === 0 ? (
            <p className="p-5 text-sm text-muted">No categories yet.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[10px] tracking-wide text-muted uppercase">
                  <th className="sticky left-0 z-10 bg-surface px-3 py-3">#</th>
                  <th className="sticky left-8 z-10 bg-surface px-3 py-3 sm:left-10">
                    Team
                  </th>
                  {categories.map((c) => (
                    <th key={c.id} className="whitespace-nowrap px-3 py-3">
                      {c.name}
                      {!c.include_in_scoring ? (
                        <span className="mt-0.5 block text-[9px] font-normal tracking-wide text-muted normal-case">
                          EVENT ONLY
                        </span>
                      ) : null}
                    </th>
                  ))}
                  <th className="px-3 py-3">
                    Overall
                    <span className="mt-0.5 block text-[9px] font-normal tracking-wide text-muted normal-case">
                      scoring cats
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {matrixRows.map((row) => {
                  const selected = selectedTeam?.id === row.team.id;
                  const hasAnyDraft = competitions.some((c) =>
                    draftMap.has(
                      `${row.team.id}:${c.id}` as `${string}:${string}`,
                    ),
                  );
                  const stickyBg = selected ? "bg-[#2a1a12]" : "bg-surface";
                  return (
                    <tr
                      key={row.team.id}
                      className={`border-b border-border/60 ${selected ? "bg-accent-soft" : ""}`}
                    >
                      <td
                        className={`sticky left-0 z-10 px-3 py-3 font-mono text-xs text-muted ${stickyBg}`}
                      >
                        {String(row.rank).padStart(2, "0")}
                      </td>
                      <td
                        className={`sticky left-8 z-10 whitespace-nowrap px-3 py-3 font-medium sm:left-10 ${stickyBg}`}
                      >
                        {row.team.name}
                      </td>
                      {categories.map((c) => {
                        const compsInCategory = competitions.filter(
                          (comp) => comp.category_id === c.id,
                        );
                        const draftComp =
                          compsInCategory.find((comp) =>
                            draftMap.has(
                              `${row.team.id}:${comp.id}` as `${string}:${string}`,
                            ),
                          ) ?? compsInCategory[0];
                        const hasDraft = Boolean(
                          compsInCategory.find((comp) =>
                            draftMap.has(
                              `${row.team.id}:${comp.id}` as `${string}:${string}`,
                            ),
                          ),
                        );
                        const points = row.byCategory[c.slug] ?? 0;
                        const href = draftComp
                          ? `/admin/leaderboards?team=${row.team.id}&category=${c.id}&competition=${draftComp.id}`
                          : `/admin/categories`;
                        return (
                          <td key={c.id} className="px-3 py-3">
                            <Link
                              href={href}
                              className={
                                hasDraft
                                  ? "inline-flex min-h-9 min-w-9 items-center font-semibold text-accent"
                                  : "inline-flex min-h-9 min-w-9 items-center text-foreground"
                              }
                            >
                              {points}
                              {hasDraft ? " *" : ""}
                            </Link>
                          </td>
                        );
                      })}
                      <td
                        className={`whitespace-nowrap px-3 py-3 font-display text-lg ${hasAnyDraft ? "text-accent" : ""}`}
                      >
                        {formatPoints(row.total)}
                        {hasAnyDraft ? " *" : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl sm:text-2xl">Recent changes</h2>
          <Link
            href="/admin/leaderboards/history"
            className="shrink-0 text-sm text-accent"
          >
            History →
          </Link>
        </div>
        <ul className="mt-4 space-y-3">
          {recent.slice(0, 5).map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 border-b border-border/50 pb-3 text-sm last:border-0 last:pb-0 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:border-0 sm:pb-0"
            >
              <span className="leading-5">{item.summary}</span>
              <div className="flex items-center gap-2">
                <Badge tone={item.action === "published" ? "success" : "accent"}>
                  {item.action.replaceAll("_", " ")}
                </Badge>
                <span className="text-xs text-muted">
                  {formatDateTime(item.created_at)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function AdminLeaderboardsPage(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
          Loading leaderboards…
        </div>
      }
    >
      <LeaderboardsContent {...props} />
    </Suspense>
  );
}