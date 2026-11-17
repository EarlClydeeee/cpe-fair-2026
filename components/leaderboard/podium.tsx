import Image from "next/image";
import Link from "next/link";
import type { StandingRow } from "@/lib/data/public";
import { formatPoints } from "@/lib/format";

const podiumMeta = [
  {
    copy: "LEADING THE FLIGHT",
    numColor: "text-[#ff6a00]",
    borderColor: "border-[#ff6a00]/30 border-l-[6px] border-l-[#ff6a00]",
    bgImage: "/teams/court-karasuno.png",
  },
  {
    copy: "THE CHASE IS ON",
    numColor: "text-red-500",
    borderColor: "border-red-500/30 border-l-[6px] border-l-red-500",
    bgImage: "/teams/court-nekoma.png",
  },
  {
    copy: "EYES ON THE TOP",
    numColor: "text-cyan-400",
    borderColor: "border-cyan-400/30 border-l-[6px] border-l-cyan-400",
    bgImage: "/teams/court-aoba-johsai.png",
  },
];

export function Podium({ rows }: { rows: StandingRow[] }) {
  const top3 = rows.slice(0, 3);
  if (!top3.length) return null;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {top3.map((row, i) => {
        const meta = podiumMeta[i] ?? podiumMeta[0];
        const courtSrc = meta.bgImage;

        return (
          <Link
            key={row.team.id}
            href={`/teams/${row.team.slug}`}
            className={`group relative isolate flex min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl border ${meta.borderColor} bg-[#1a1b1d] p-6 shadow-xl shadow-black/80 transition-all duration-200 hover:brightness-105 hover:shadow-2xl`}
          >
            {/* Stadium Court & Mascot Artwork on the right half - full visual clarity */}
            <div className="pointer-events-none absolute inset-y-0 right-0 w-[58%] overflow-hidden opacity-90 transition-opacity duration-200 group-hover:opacity-100">
              <Image
                src={courtSrc}
                alt={`${row.team.name} court`}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover object-right"
              />
            </div>

            {/* Seamless gradient fade from left to blend text area into court artwork */}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#1a1b1d] via-[#1a1b1d]/70 to-transparent"
              aria-hidden
            />

            {/* Header: Rank + Copy */}
            <div className="relative z-10 flex items-center gap-3">
              <span className={`font-display text-4xl font-black leading-none ${meta.numColor}`}>
                {String(row.rank).padStart(2, "0")}
              </span>
              <span className="text-[11px] font-bold tracking-[0.16em] text-neutral-300 uppercase">
                {meta.copy}
              </span>
            </div>

            {/* Body: Section + Team Name */}
            <div className="relative z-10 my-auto py-2">
              <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                {row.team.affiliation || "Unaffiliated"}
              </p>
              <h3 className="mt-1 font-display text-3xl font-black tracking-wide text-white uppercase sm:text-4xl">
                {row.team.name}
              </h3>
            </div>

            {/* Footer: Points */}
            <div className="relative z-10 flex items-baseline">
              <span className="font-display text-4xl font-black text-[#faf8f5] sm:text-5xl leading-none">
                {formatPoints(row.total)}
              </span>
              <span className="ml-2.5 text-xs font-bold tracking-widest text-neutral-400 uppercase">
                PTS
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
