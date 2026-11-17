import type { Metadata } from "next";
import Link from "next/link";
import { ScorePanel } from "@/components/admin/score-panel";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { getAuditLog } from "@/lib/data/admin";
import { getScoreMatrix } from "@/lib/data/standings";
import { formatDateTime, formatPoints } from "@/lib/format";

export const metadata: Metadata = { title: "Leaderboard control" };

type Props = { searchParams: Promise<{ team?: string; category?: string }> };

export default async function AdminLeaderboardsPage({ searchParams }: Props) {
  const { team: teamId, category: categoryId } = await searchParams;
  const { categories, rows, drafts, draftMap } = await getScoreMatrix();
  const recent = await getAuditLog();

  const selectedTeam = rows.find((r) => r.team.id === teamId)?.team ?? rows[0]?.team;
  const selectedCategory =
    categories.find((c) => c.id === categoryId) ?? categories[0];
  const draft =
    selectedTeam && selectedCategory
      ? draftMap.get(`${selectedTeam.id}:${selectedCategory.id}` as `${string}:${string}`)
      : undefined;
  const selectedRow = selectedTeam
    ? rows.find((r) => r.team.id === selectedTeam.id)
    : undefined;
  const publishedPoints =
    selectedRow && selectedCategory
      ? selectedRow.byCategory[selectedCategory.slug] ?? 0
      : 0;
  const teamTotal = selectedRow?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl">Leaderboard Control</h1>
          <p className="mt-2 text-sm text-muted">
            Edit category scores as drafts, then review before going public.
          </p>
        </div>
        <div className="flex gap-2">
          <LinkButton href="/api/admin/scores/export" variant="secondary">
            Export scores
          </LinkButton>
          <LinkButton href="/admin/leaderboards/review">
            Review & publish ({drafts.length})
          </LinkButton>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Teams", String(rows.length).padStart(2, "0")],
          ["Categories", String(categories.length).padStart(2, "0")],
          ["Published points", formatPoints(rows.reduce((s, r) => s + r.total, 0))],
          ["Saved draft", String(drafts.length).padStart(2, "0")],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-[10px] tracking-wide text-muted uppercase">{label}</p>
            <p className="mt-1 font-display text-3xl">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_0.9fr]">
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[10px] tracking-wide text-muted uppercase">
                <th className="px-3 py-3">#</th>
                <th className="px-3 py-3">Team</th>
                {categories.map((c) => (
                  <th key={c.id} className="px-3 py-3">
                    {c.name}
                  </th>
                ))}
                <th className="px-3 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const selected = selectedTeam?.id === row.team.id;
                return (
                  <tr
                    key={row.team.id}
                    className={`border-b border-border/60 ${selected ? "bg-accent-soft" : ""}`}
                  >
                    <td className="px-3 py-3 font-mono text-xs text-muted">
                      {String(row.rank).padStart(2, "0")}
                    </td>
                    <td className="px-3 py-3 font-medium">{row.team.name}</td>
                    {categories.map((c) => {
                      const key = `${row.team.id}:${c.id}` as `${string}:${string}`;
                      const hasDraft = draftMap.has(key);
                      const points = hasDraft
                        ? draftMap.get(key)!.draft_points
                        : row.byCategory[c.slug] ?? 0;
                      return (
                        <td key={c.id} className="px-3 py-3">
                          <Link
                            href={`/admin/leaderboards?team=${row.team.id}&category=${c.id}`}
                            className={hasDraft ? "font-semibold text-accent" : "text-foreground"}
                          >
                            {points}
                            {hasDraft ? " *" : ""}
                          </Link>
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 font-display text-lg">{formatPoints(row.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {selectedTeam && selectedCategory ? (
          <ScorePanel
            key={`${selectedTeam.id}-${selectedCategory.id}`}
            teams={rows.map((r) => ({ id: r.team.id, name: r.team.name }))}
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            selectedTeamId={selectedTeam.id}
            selectedCategoryId={selectedCategory.id}
            publishedPoints={publishedPoints}
            teamTotal={teamTotal}
            draftPoints={draft?.draft_points}
            draftId={draft?.id}
            reason={draft?.reason}
          />
        ) : null}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl">Recent changes</h2>
          <Link href="/admin/leaderboards/history" className="text-sm text-accent">
            Full history →
          </Link>
        </div>
        <ul className="mt-4 space-y-3">
          {recent.slice(0, 5).map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>{item.summary}</span>
              <div className="flex items-center gap-2">
                <Badge tone={item.action === "published" ? "success" : "accent"}>
                  {item.action.replaceAll("_", " ")}
                </Badge>
                <span className="text-xs text-muted">{formatDateTime(item.created_at)}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
