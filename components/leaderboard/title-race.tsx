import type { StandingRow } from "@/lib/data/public";
import { formatPoints } from "@/lib/format";

export function TitleRace({
  rows,
  categoryName,
  categoryCount,
}: {
  rows: StandingRow[];
  categoryName?: string;
  categoryCount: number;
}) {
  const leader = rows[0];
  if (!leader) return null;

  const chasers = rows.slice(1, 4);
  const leadOverSecond =
    chasers[0] != null ? leader.total - chasers[0].total : null;

  return (
    <div className="rounded-xl border border-neutral-800/90 bg-[#16171b] p-4 text-white shadow-sm sm:p-6">
      <p className="text-[10px] font-bold tracking-[0.18em] text-neutral-400 uppercase">
        The title race
      </p>

      <div className="mt-4">
        <p className="text-[10px] font-bold tracking-[0.14em] text-accent uppercase">
          Leading
        </p>
        <p className="mt-1 font-display text-2xl font-black uppercase tracking-tight truncate">
          {leader.team.name}
        </p>
        <p className="mt-1 text-sm text-neutral-400">
          {formatPoints(leader.total)} pts
          {leadOverSecond != null ? (
            <>
              {" "}
              · {formatPoints(leadOverSecond)} ahead of #{String(2).padStart(2, "0")}
            </>
          ) : null}
        </p>
      </div>

      {chasers.length ? (
        <div className="mt-5 space-y-3">
          <p className="text-[10px] font-bold tracking-[0.14em] text-neutral-500 uppercase">
            Point differentials
          </p>
          {chasers.map((row) => {
            const gap = Math.abs(row.toLeader);
            return (
              <div
                key={row.team.id}
                className="rounded-lg border border-neutral-800 bg-[#1a1b1f] px-3 py-3"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono text-neutral-500">
                      #{String(row.rank).padStart(2, "0")}
                    </p>
                    <p className="truncate text-sm font-semibold text-white">
                      {row.team.name}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-2xl font-black leading-none text-white">
                      −{formatPoints(gap)}
                    </p>
                    <p className="mt-1 text-[9px] font-bold tracking-[0.14em] text-neutral-500 uppercase">
                      To leader
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                  {formatPoints(row.total)} pts total
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 text-xs text-neutral-500">
          No chase pack yet — only one team on the board.
        </p>
      )}

      <div className="mt-5 border-t border-neutral-800 pt-4">
        <p className="font-display text-3xl font-black text-white leading-none">
          {categoryName ? "1" : categoryCount || 7}
        </p>
        <p className="mt-1.5 text-[9px] font-bold tracking-[0.16em] text-neutral-400 uppercase">
          {categoryName ? "CATEGORY" : "CATEGORIES"}
        </p>
        <p className="mt-2 text-xs text-neutral-400 truncate">
          {categoryName ? `${categoryName} standings` : "One overall champion"}
        </p>
      </div>
    </div>
  );
}
