import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { LeaderboardBoard } from "@/components/admin/leaderboard-board";
import { LeaderboardNav } from "@/components/admin/leaderboard-nav";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { getAuditLog } from "@/lib/data/admin";
import { getScoreMatrix } from "@/lib/data/standings";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Scores" };
export const instant = false;

type Props = { searchParams: Promise<{ team?: string; category?: string }> };

async function LeaderboardsContent({ searchParams }: Props) {
  await connection();
  const { team: teamId, category: categoryId } = await searchParams;
  const { categories, rows, drafts } = await getScoreMatrix();
  const recent = await getAuditLog();

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl leading-none sm:text-5xl">Scores</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Pick a cell, edit the draft, then continue to review before it goes public.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <LinkButton href="/api/admin/scores/export" variant="secondary" className="min-h-11">
            Export
          </LinkButton>
          <LinkButton href="/admin/leaderboards/review" className="min-h-11">
            Next: Review ({drafts.length})
          </LinkButton>
        </div>
      </div>

      <LeaderboardNav draftCount={drafts.length} />

      <LeaderboardBoard
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
        }))}
        rows={rows.map((row) => ({
          team: {
            id: row.team.id,
            name: row.team.name,
            sort_order: row.team.sort_order,
          },
          publishedBySlug: row.byCategory,
          publishedTotal: row.total,
        }))}
        drafts={drafts.map((draft) => ({
          id: draft.id,
          teamId: draft.team_id,
          categoryId: draft.category_id,
          points: draft.draft_points,
          reason: draft.reason ?? "",
        }))}
        initialTeamId={teamId}
        initialCategoryId={categoryId}
      />

      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl sm:text-2xl">Recent changes</h2>
          <Link href="/admin/leaderboards/history" className="shrink-0 text-sm text-accent">
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
                <span className="text-xs text-muted">{formatDateTime(item.created_at)}</span>
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
