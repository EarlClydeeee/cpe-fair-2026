"use client";

import { useCallback, useMemo, useState } from "react";
import { ScorePanel } from "@/components/admin/score-panel";
import { formatPoints } from "@/lib/format";

type Category = { id: string; name: string; slug: string };
type Draft = {
  id: string;
  teamId: string;
  categoryId: string;
  points: number;
  reason: string;
};
type TeamRow = {
  team: { id: string; name: string; sort_order: number };
  publishedBySlug: Record<string, number>;
  publishedTotal: number;
};

export function LeaderboardBoard({
  categories,
  rows,
  drafts,
  initialTeamId,
  initialCategoryId,
}: {
  categories: Category[];
  rows: TeamRow[];
  drafts: Draft[];
  initialTeamId?: string;
  initialCategoryId?: string;
}) {
  const [teamId, setTeamId] = useState(initialTeamId ?? rows[0]?.team.id ?? "");
  const [categoryId, setCategoryId] = useState(initialCategoryId ?? categories[0]?.id ?? "");
  const [focus, setFocus] = useState<"matrix" | "editor">(initialTeamId ? "editor" : "matrix");
  const [live, setLive] = useState<{ teamId: string; categoryId: string; score: number } | null>(
    null,
  );

  const draftByKey = useMemo(() => {
    const map = new Map<string, Draft>();
    for (const draft of drafts) map.set(`${draft.teamId}:${draft.categoryId}`, draft);
    return map;
  }, [drafts]);

  const onLiveScore = useCallback((nextTeamId: string, nextCategoryId: string, score: number) => {
    setLive({ teamId: nextTeamId, categoryId: nextCategoryId, score });
  }, []);

  function selectCell(nextTeamId: string, nextCategoryId: string) {
    setTeamId(nextTeamId);
    setCategoryId(nextCategoryId);
    setFocus("editor");
    const params = new URLSearchParams(window.location.search);
    params.set("team", nextTeamId);
    params.set("category", nextCategoryId);
    window.history.replaceState(null, "", `/admin/leaderboards?${params.toString()}`);
  }

  const matrix = useMemo(() => {
    const built = rows.map((row) => {
      const byCategory: Record<string, number> = {};
      let total = 0;
      let hasDraft = false;
      let unsaved = false;
      for (const category of categories) {
        const key = `${row.team.id}:${category.id}`;
        const draft = draftByKey.get(key);
        const published = row.publishedBySlug[category.slug] ?? 0;
        const isLive = live?.teamId === row.team.id && live.categoryId === category.id;
        const points = isLive ? live.score : (draft?.points ?? published);
        byCategory[category.slug] = points;
        total += points;
        if (draft || isLive) hasDraft = true;
        if (isLive && points !== (draft?.points ?? published)) unsaved = true;
      }
      return { ...row, byCategory, total, hasDraft, unsaved };
    });
    return built
      .sort((a, b) => b.total - a.total || a.team.sort_order - b.team.sort_order)
      .map((row, index) => ({ ...row, rank: index + 1 }));
  }, [rows, categories, draftByKey, live]);

  const selectedRow = matrix.find((row) => row.team.id === teamId) ?? matrix[0];
  const selectedCategory = categories.find((category) => category.id === categoryId) ?? categories[0];
  const selectedSource = rows.find((row) => row.team.id === selectedRow?.team.id);
  const publishedPoints =
    selectedSource && selectedCategory
      ? (selectedSource.publishedBySlug[selectedCategory.slug] ?? 0)
      : 0;
  const draft =
    selectedRow && selectedCategory
      ? draftByKey.get(`${selectedRow.team.id}:${selectedCategory.id}`)
      : undefined;
  const matrixTotal = matrix.reduce((sum, row) => sum + row.total, 0);

  return (
    <div className="space-y-5">
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:grid-cols-4 sm:gap-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            ["Teams", String(matrix.length).padStart(2, "0")],
            ["Categories", String(categories.length).padStart(2, "0")],
            ["Matrix total", formatPoints(matrixTotal)],
            ["Saved drafts", String(drafts.length).padStart(2, "0")],
          ].map(([label, value]) => (
            <div
              key={label}
              className="min-w-[9.5rem] shrink-0 rounded-xl border border-border bg-surface p-3.5 sm:min-w-0 sm:shrink sm:p-4"
            >
              <p className="text-[10px] tracking-wide text-muted uppercase">{label}</p>
              <p className="mt-1 font-display text-2xl sm:text-3xl">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_0.9fr]">
        {selectedRow && selectedCategory ? (
          <div className={`${focus === "matrix" ? "hidden xl:block" : ""} xl:order-2`}>
            <button
              type="button"
              onClick={() => setFocus("matrix")}
              className="mb-3 inline-flex min-h-10 items-center text-sm font-medium text-accent xl:hidden"
            >
              ← Back to score matrix
            </button>
            <ScorePanel
              teams={rows.map((row) => ({ id: row.team.id, name: row.team.name }))}
              categories={categories.map((category) => ({ id: category.id, name: category.name }))}
              selectedTeamId={selectedRow.team.id}
              selectedCategoryId={selectedCategory.id}
              publishedPoints={publishedPoints}
              teamTotal={selectedSource?.publishedTotal ?? 0}
              draftPoints={draft?.points}
              draftId={draft?.id}
              reason={draft?.reason ?? ""}
              onSelect={selectCell}
              onLiveScore={onLiveScore}
            />
          </div>
        ) : null}

        <div className={`${focus === "editor" ? "hidden xl:block" : ""} xl:order-1`}>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl">Score matrix</h2>
              <p className="mt-1 text-xs text-muted">
                Tap a cell to edit that team and category. The number updates as you type.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[10px] tracking-wide text-muted uppercase">
                  <th className="sticky left-0 z-10 bg-surface px-3 py-3">#</th>
                  <th className="sticky left-8 z-10 bg-surface px-3 py-3 sm:left-10">Team</th>
                  {categories.map((category) => (
                    <th
                      key={category.id}
                      className={`whitespace-nowrap px-3 py-3 ${
                        category.id === selectedCategory?.id ? "text-accent" : ""
                      }`}
                    >
                      {category.name}
                    </th>
                  ))}
                  <th className="px-3 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {matrix.map((row) => {
                  const selected = selectedRow?.team.id === row.team.id;
                  const stickyBg = selected ? "bg-[#2a1a12]" : "bg-surface";
                  return (
                    <tr
                      key={row.team.id}
                      className={`border-b border-border/60 ${selected ? "bg-accent-soft" : ""}`}
                    >
                      <td className={`sticky left-0 z-10 px-3 py-3 font-mono text-xs text-muted ${stickyBg}`}>
                        {String(row.rank).padStart(2, "0")}
                      </td>
                      <td
                        className={`sticky left-8 z-10 whitespace-nowrap px-3 py-3 font-medium sm:left-10 ${stickyBg}`}
                      >
                        {row.team.name}
                      </td>
                      {categories.map((category) => {
                        const key = `${row.team.id}:${category.id}`;
                        const saved = draftByKey.get(key);
                        const published = row.publishedBySlug[category.slug] ?? 0;
                        const points = row.byCategory[category.slug] ?? 0;
                        const active =
                          row.team.id === selectedRow?.team.id && category.id === selectedCategory?.id;
                        const dirty = active && points !== (saved?.points ?? published);
                        return (
                          <td key={category.id} className="px-3 py-3">
                            <button
                              type="button"
                              onClick={() => selectCell(row.team.id, category.id)}
                              className={`inline-flex min-h-9 min-w-9 items-center rounded-md px-1.5 ${
                                active
                                  ? "bg-accent font-semibold text-black"
                                  : saved
                                    ? "font-semibold text-accent"
                                    : "text-foreground"
                              }`}
                            >
                              {points}
                              {saved || dirty ? " *" : ""}
                            </button>
                          </td>
                        );
                      })}
                      <td
                        className={`whitespace-nowrap px-3 py-3 font-display text-lg ${
                          row.hasDraft || row.unsaved ? "text-accent" : ""
                        }`}
                      >
                        {formatPoints(row.total)}
                        {row.hasDraft || row.unsaved ? " *" : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted">* includes a saved draft or the score you are editing.</p>
        </div>
      </div>
    </div>
  );
}
