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

const compactCopy = ["LEADING", "CHASE", "RISING"] as const;

function PodiumCard({
  row,
  index,
  compact = false,
}: {
  row: StandingRow;
  index: number;
  compact?: boolean;
}) {
  const meta = podiumMeta[index] ?? podiumMeta[0];
  const copy = compact ? (compactCopy[index] ?? meta.copy) : meta.copy;

  return (
    <Link
      href={`/teams/${row.team.slug}`}
      className={`group relative isolate flex flex-col justify-between overflow-hidden rounded-2xl border ${meta.borderColor} bg-[#1a1b1d] shadow-xl shadow-black/80 transition-[filter,box-shadow] duration-200 hover:brightness-105 ${
        compact ? "min-h-[156px] p-3.5" : "min-h-[200px] p-5 sm:min-h-[220px] sm:p-6"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 overflow-hidden opacity-90 transition-opacity duration-200 group-hover:opacity-100 ${
          compact ? "w-[48%]" : "w-[58%]"
        }`}
      >
        <Image
          src={meta.bgImage}
          alt=""
          fill
          priority={index === 0}
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover object-right"
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#1a1b1d] via-[#1a1b1d]/75 to-transparent"
        aria-hidden
      />

      <div className="relative z-10 flex items-center gap-2 sm:gap-3">
        <span
          className={`font-display font-black leading-none ${meta.numColor} ${
            compact ? "text-3xl" : "text-4xl"
          }`}
        >
          {String(row.rank).padStart(2, "0")}
        </span>
        <span
          className={`font-bold tracking-[0.14em] text-neutral-300 uppercase ${
            compact ? "text-[9px] leading-none" : "text-[11px]"
          }`}
        >
          {copy}
        </span>
      </div>

      <div className="relative z-10 my-auto py-2">
        <p
          className={`truncate font-semibold tracking-wider text-neutral-400 uppercase ${
            compact ? "text-[9px]" : "text-xs"
          }`}
        >
          {row.team.affiliation || "Unaffiliated"}
        </p>
        <h3
          className={`mt-1 font-display font-black tracking-wide text-white uppercase ${
            compact ? "text-[1.05rem] leading-tight" : "text-3xl sm:text-4xl"
          }`}
        >
          {row.team.name}
        </h3>
      </div>

      <div className="relative z-10 flex items-baseline">
        <span
          className={`font-display font-black text-[#faf8f5] leading-none ${
            compact ? "text-[1.75rem]" : "text-4xl sm:text-5xl"
          }`}
        >
          {formatPoints(row.total)}
        </span>
        <span className="ml-1.5 text-[9px] font-bold tracking-widest text-neutral-400 uppercase sm:ml-2.5 sm:text-xs">
          PTS
        </span>
      </div>
    </Link>
  );
}

export function Podium({ rows }: { rows: StandingRow[] }) {
  const top3 = rows.slice(0, 3);
  if (!top3.length) return null;

  const [first, second, third] = top3;

  return (
    <>
      {/* Phone: leader full-bleed, chase pair underneath */}
      <div className="space-y-3 md:hidden">
        {first ? <PodiumCard row={first} index={0} /> : null}
        {(second || third) && (
          <div className="grid grid-cols-2 gap-3">
            {second ? <PodiumCard row={second} index={1} compact /> : null}
            {third ? <PodiumCard row={third} index={2} compact /> : null}
          </div>
        )}
      </div>

      {/* Desktop / tablet: equal three-up */}
      <div className="hidden gap-4 md:grid md:grid-cols-3">
        {top3.map((row, i) => (
          <PodiumCard key={row.team.id} row={row} index={i} />
        ))}
      </div>
    </>
  );
}
