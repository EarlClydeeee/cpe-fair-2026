import Link from "next/link";
import type { StandingRow } from "@/lib/data/public";
import { formatPoints } from "@/lib/format";

export function StandingsTable({ rows }: { rows: StandingRow[] }) {
  const leaderTotal = rows[0]?.total ?? 0;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="grid grid-cols-[48px_minmax(0,1.6fr)_minmax(0,1fr)_88px_80px] gap-2 border-b border-border px-4 py-3 text-[10px] tracking-[0.16em] text-muted uppercase sm:grid-cols-[56px_minmax(0,1.4fr)_minmax(0,1fr)_100px_90px]">
        <span>Rank</span>
        <span>Team</span>
        <span className="hidden sm:block">Affiliation</span>
        <span>Points</span>
        <span>To leader</span>
      </div>
      {rows.map((row) => {
        const barWidth =
          leaderTotal === 0 ? 0 : Math.max(0, Math.min(100, (row.total / leaderTotal) * 100));
        return (
          <Link
            key={row.team.id}
            href={`/teams/${row.team.slug}`}
            className="grid grid-cols-[48px_minmax(0,1.6fr)_minmax(0,1fr)_88px_80px] items-center gap-2 border-b border-border/60 px-4 py-3 transition-colors duration-200 hover:bg-surface-2 sm:grid-cols-[56px_minmax(0,1.4fr)_minmax(0,1fr)_100px_90px]"
          >
            <span className="font-mono text-sm text-muted">
              {String(row.rank).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <span className="block truncate font-medium">{row.team.name}</span>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${barWidth}%`,
                    background: row.team.color_hex,
                  }}
                />
              </div>
              <span className="mt-1 block truncate text-[11px] text-muted sm:hidden">
                {row.team.affiliation}
              </span>
            </div>
            <span className="hidden truncate text-sm text-muted sm:block">
              {row.team.affiliation}
            </span>
            <span className="font-display text-xl">{formatPoints(row.total)}</span>
            <span className="text-sm text-muted">
              {row.toLeader === 0 ? "—" : row.toLeader}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
