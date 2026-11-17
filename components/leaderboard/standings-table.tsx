import Link from "next/link";
import type { StandingRow } from "@/lib/data/public";
import { formatPoints } from "@/lib/format";

function hexToRgb(hex: string) {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: (num >> 0) & 255,
  };
}

function getBannerStyle(hex: string) {
  const rgb = hexToRgb(hex);

  const lr = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * 0.22));
  const lg = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * 0.22));
  const lb = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * 0.22));

  const dr = Math.round(rgb.r * 0.8);
  const dg = Math.round(rgb.g * 0.8);
  const db = Math.round(rgb.b * 0.8);

  const nr = Math.round(rgb.r * 0.45);
  const ng = Math.round(rgb.g * 0.45);
  const nb = Math.round(rgb.b * 0.45);

  const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  const isLight = lum > 0.52 && hex.toLowerCase() !== "#a855f7";

  return {
    baseColor: hex,
    gradient: `linear-gradient(90deg, rgb(${lr}, ${lg}, ${lb}) 0%, ${hex} 55%, rgb(${dr}, ${dg}, ${db}) 100%)`,
    notchColor: `rgb(${nr}, ${ng}, ${nb})`,
    textColor: isLight ? "#000000" : "#ffffff",
    subColor: isLight ? "rgba(0, 0, 0, 0.78)" : "rgba(255, 255, 255, 0.82)",
  };
}

export function StandingsTable({ rows }: { rows: StandingRow[] }) {
  return (
    <section className="space-y-3.5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-black tracking-wide text-white uppercase sm:text-3xl">
            Team Standings
          </h2>
          <p className="mt-1 text-xs font-medium text-neutral-400">
            Overall points across all competition categories
          </p>
        </div>
        <p className="text-xs font-bold tracking-[0.18em] text-neutral-400 uppercase">
          {rows.length} {rows.length === 1 ? "team" : "teams"}
        </p>
      </div>

      {/* Desktop column labels */}
      <div className="hidden items-center gap-2.5 px-0.5 text-[10px] font-bold tracking-[0.18em] text-neutral-400 uppercase select-none sm:flex">
        <span className="w-[52px] shrink-0 text-center">Rank</span>
        <div className="grid flex-1 grid-cols-[minmax(0,1.8fr)_minmax(0,1.4fr)_100px_90px] items-center px-6">
          <span>Team Name</span>
          <span>Affiliation</span>
          <span className="pr-4 text-right">To Leader</span>
          <span className="pr-1 text-right">Total</span>
        </div>
      </div>

      <div className="space-y-2">
        {rows.map((row, i) => {
          const isLeader = row.rank === 1;
          const style = getBannerStyle(row.team.color_hex);

          return (
            <Link
              key={row.team.id}
              href={`/teams/${row.team.slug}`}
              className="group flex items-stretch gap-2 transition-colors duration-200 sm:gap-2.5 sm:hover:translate-x-1"
            >
              <div
                className="flex w-11 shrink-0 items-center justify-center rounded-lg border bg-[#121316] font-display text-sm font-black text-white sm:h-[56px] sm:w-[52px] sm:text-base"
                style={{
                  borderColor: `${style.baseColor}66`,
                  boxShadow: `0 0 12px ${style.baseColor}15`,
                }}
              >
                {String(row.rank).padStart(2, "0")}
              </div>

              <div
                className="relative min-w-0 flex-1 overflow-hidden rounded-lg sm:rounded-l-lg"
                style={{
                  background: style.gradient,
                  clipPath:
                    "polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)",
                  color: style.textColor,
                }}
              >
                <div
                  className="pointer-events-none absolute right-0 bottom-0 hidden h-3.5 w-3.5 sm:block"
                  style={{ background: style.notchColor }}
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-y-0 w-28 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-subtle-sweep"
                  style={{ animationDelay: `${i * 0.9}s` }}
                  aria-hidden
                />

                {/* Phone row */}
                <div className="relative z-10 flex items-center justify-between gap-3 px-3.5 py-3 sm:hidden">
                  <div className="min-w-0">
                    <p className="truncate font-display text-[15px] font-black tracking-wide uppercase">
                      {row.team.name}
                    </p>
                    <p
                      className="mt-0.5 truncate text-[11px] font-semibold"
                      style={{ color: style.subColor }}
                    >
                      {row.team.affiliation || "Unaffiliated"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-2xl font-black leading-none">
                      {formatPoints(row.total)}
                    </p>
                    <p
                      className="mt-1 text-[10px] font-bold tracking-wider uppercase"
                      style={{ color: style.subColor }}
                    >
                      {isLeader ? "Leader" : formatPoints(row.toLeader)}
                    </p>
                  </div>
                </div>

                {/* Desktop row */}
                <div className="relative z-10 hidden h-[56px] w-full grid-cols-[minmax(0,1.8fr)_minmax(0,1.4fr)_100px_90px] items-center px-6 sm:grid">
                  <div className="min-w-0 pr-3">
                    <span className="block truncate font-display text-lg font-black tracking-wide uppercase">
                      {row.team.name}
                    </span>
                  </div>
                  <div
                    className="min-w-0 truncate pr-3 text-sm font-semibold"
                    style={{ color: style.subColor }}
                  >
                    {row.team.affiliation || "Unaffiliated"}
                  </div>
                  <div className="pr-4 text-right text-sm font-black tracking-wider uppercase">
                    {isLeader ? "LEADER" : formatPoints(row.toLeader)}
                  </div>
                  <div className="pr-1 text-right font-display text-3xl font-black leading-none">
                    {row.total}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
