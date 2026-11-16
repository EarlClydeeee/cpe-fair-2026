import Link from "next/link";
import { Placeholder } from "@/components/placeholder";
import { Badge } from "@/components/ui/badge";
import type { StandingRow } from "@/lib/data/public";
import { formatPoints } from "@/lib/format";

const podiumCopy = ["Leading the flight", "The chase is on", "Eyes on the top"];

export function Podium({ rows }: { rows: StandingRow[] }) {
  const top3 = rows.slice(0, 3);
  if (!top3.length) return null;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {top3.map((row, i) => {
        const isLeader = i === 0;
        return (
          <Link
            key={row.team.id}
            href={`/teams/${row.team.slug}`}
            className={`overflow-hidden rounded-xl border bg-surface transition-colors duration-200 hover:border-accent/40 ${
              isLeader ? "border-accent/50 md:order-none" : "border-border"
            }`}
          >
            <Placeholder
              label={row.team.name}
              ratio="4/3"
              color={row.team.color_hex}
              className="rounded-none border-0"
            />
            <div
              className="space-y-2 p-4"
              style={{ borderTop: `3px solid ${row.team.color_hex}` }}
            >
              <Badge tone="accent">#{String(row.rank).padStart(2, "0")}</Badge>
              <h2 className={`font-display ${isLeader ? "text-4xl" : "text-3xl"}`}>
                {row.team.name}
              </h2>
              <p className="text-xs text-muted">{row.team.affiliation}</p>
              <p className="text-xs tracking-[0.12em] text-muted uppercase">
                {podiumCopy[i]}
              </p>
              <p className={`font-display ${isLeader ? "text-5xl" : "text-4xl"}`}>
                {formatPoints(row.total)} PTS
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
