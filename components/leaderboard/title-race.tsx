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
      <p className="mt-3 font-display text-4xl text-accent">
        {formatPoints(lead)} POINT LEAD
      </p>
      <p className="mt-2 text-sm text-foreground/90">
        {first.team.name} over {second.team.name}
      </p>
      <p className="mt-2 text-sm text-muted">
        {categoryName
          ? `${categoryName} standings`
          : `${categoryCount} categories in play`}
      </p>
    </div>
  );
}
