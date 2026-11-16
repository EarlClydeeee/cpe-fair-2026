import Link from "next/link";
import { TeamBanner } from "@/components/team-banner";
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
            className={`group relative isolate min-h-[220px] overflow-hidden rounded-xl border transition-colors duration-200 hover:border-accent/50 ${
              isLeader ? "border-accent/60" : "border-border"
            }`}
          >
            <span
              className="absolute inset-y-0 left-0 z-20 w-1"
              style={{ background: row.team.color_hex }}
              aria-hidden
            />
            <TeamBanner
              name={row.team.name}
              colorHex={row.team.color_hex}
              artworkUrl={row.team.artwork_url}
              fill
              className="absolute inset-0 rounded-none border-0"
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/75 to-black/30"
              aria-hidden
            />
            <div className="relative z-10 flex h-full min-h-[220px] flex-col justify-between gap-4 p-4 pl-5 sm:p-5 sm:pl-6">
              <div className="relative min-w-0 pr-10">
                <p className="text-[10px] tracking-[0.16em] text-accent uppercase">
                  {podiumCopy[i]}
                </p>
                <p
                  className={`mt-3 truncate font-display leading-none tracking-wide ${
                    isLeader ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"
                  }`}
                >
                  {row.team.name}
                </p>
                <p className="mt-2 truncate text-xs tracking-[0.12em] text-muted uppercase">
                  {row.team.affiliation || "Unaffiliated"}
                </p>
                <span
                  className={`pointer-events-none absolute top-0 right-0 font-display leading-none text-white/12 ${
                    isLeader ? "text-6xl sm:text-7xl" : "text-5xl sm:text-6xl"
                  }`}
                  aria-hidden
                >
                  {String(row.rank).padStart(2, "0")}
                </span>
              </div>
              <p
                className={`font-display ${isLeader ? "text-5xl text-accent" : "text-4xl"}`}
              >
                {formatPoints(row.total)}
                <span className="ml-2 text-lg tracking-[0.14em] text-muted uppercase">
                  pts
                </span>
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
