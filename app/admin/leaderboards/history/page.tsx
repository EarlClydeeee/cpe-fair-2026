import type { Metadata } from "next";
import { HistoryBrowser } from "@/components/admin/history-browser";
import { LeaderboardNav } from "@/components/admin/leaderboard-nav";
import { LinkButton } from "@/components/ui/button";
import { getAuditLog } from "@/lib/data/admin";

export const metadata: Metadata = { title: "History" };
export const instant = false;

type Props = { searchParams: Promise<{ q?: string; action?: string; id?: string }> };

export default async function ChangeHistoryPage({ searchParams }: Props) {
  const { q, action = "all", id } = await searchParams;
  const rows = await getAuditLog();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.18em] text-accent uppercase">
            A clear record of every update
          </p>
          <h1 className="mt-2 font-display text-3xl leading-none sm:text-5xl">History</h1>
          <p className="mt-2 text-sm text-muted">
            Search filters the list immediately. Open a record to read who changed what.
          </p>
        </div>
        <LinkButton href="/api/admin/history/export" variant="secondary">
          Export history
        </LinkButton>
      </div>

      <LeaderboardNav />

      <HistoryBrowser
        rows={rows.map((row) => ({
          id: row.id,
          action: row.action,
          entity_type: row.entity_type,
          entity_id: row.entity_id,
          summary: row.summary,
          actor_id: row.actor_id,
          created_at: row.created_at,
        }))}
        initialQuery={q ?? ""}
        initialAction={action}
        initialId={id}
      />
    </div>
  );
}
