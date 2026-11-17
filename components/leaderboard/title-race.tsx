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
  const first = rows[0];
  const second = rows[1];
  if (!first || !second) return null;

  const lead = first.total - second.total;

  return (
    <div className="rounded-xl border border-neutral-800/90 bg-[#16171b] p-6 text-white shadow-sm">
      <p className="text-[10px] font-bold tracking-[0.18em] text-neutral-400 uppercase">
        THE TITLE RACE
      </p>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="font-display text-4xl font-black text-white sm:text-5xl leading-none">
            {formatPoints(lead)}
          </p>
          <p className="mt-1.5 text-[9px] font-bold tracking-[0.16em] text-neutral-400 uppercase">
            POINT LEAD
          </p>
          <p className="mt-2 text-xs text-neutral-400 truncate">
            {first.team.name} over {second.team.name}
          </p>
        </div>

        <div>
          <p className="font-display text-4xl font-black text-white sm:text-5xl leading-none">
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
    </div>
  );
}
