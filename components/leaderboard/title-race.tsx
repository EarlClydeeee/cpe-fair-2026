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
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-[10px] tracking-[0.18em] text-muted uppercase">The title race</p>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="font-display text-4xl text-accent">{formatPoints(lead)}</p>
          <p className="mt-1 text-[10px] tracking-[0.14em] text-muted uppercase">
            Point lead
          </p>
          <p className="mt-2 text-sm text-foreground/90">
            {first.team.name} over {second.team.name}
          </p>
        </div>
        <div>
          <p className="font-display text-4xl">
            {categoryName ? "1" : formatPoints(categoryCount)}
          </p>
          <p className="mt-1 text-[10px] tracking-[0.14em] text-muted uppercase">
            {categoryName ? "Category" : "Categories"}
          </p>
          <p className="mt-2 text-sm text-muted">
            {categoryName ? `${categoryName} standings` : "One overall champion"}
          </p>
        </div>
      </div>
    </div>
  );
}
