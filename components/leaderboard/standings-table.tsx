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
    b: num & 255,
  };
}

function getBannerStyle(hex: string) {
  const rgb = hexToRgb(hex);

  // Lighten start by ~22%
  const lr = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * 0.22));
  const lg = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * 0.22));
  const lb = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * 0.22));

  // Darken end by ~20%
  const dr = Math.round(rgb.r * 0.8);
  const dg = Math.round(rgb.g * 0.8);
  const db = Math.round(rgb.b * 0.8);

  // Dark notch color (~45% brightness)
  const nr = Math.round(rgb.r * 0.45);
  const ng = Math.round(rgb.g * 0.45);
  const nb = Math.round(rgb.b * 0.45);

  const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  // Colors like red (#E11D48), blue (#3B82F6), and purple (#A855F7) look best with white text
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
      {/* Table Section Header */}
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

      {/* Column Headers with exact track alignment to rows */}
      <div className="flex items-center gap-2.5 px-0.5 text-[10px] font-bold tracking-[0.18em] text-neutral-400 uppercase select-none">
        <span className="w-[52px] shrink-0 text-center">Rank</span>
        <div className="grid flex-1 grid-cols-[minmax(0,1.8fr)_minmax(0,1.4fr)_100px_90px] items-center px-6">
          <span>Team Name</span>
          <span className="hidden sm:block">Affiliation</span>
          <span className="text-right sm:pr-4">To Leader</span>
          <span className="text-right pr-1">Total</span>
        </div>
      </div>

      {/* Standings List */}
      <div className="space-y-2.5">
        {rows.map((row, i) => {
          const isLeader = row.rank === 1;
          const style = getBannerStyle(row.team.color_hex);

          return (
            <Link
              key={row.team.id}
              href={`/teams/${row.team.slug}`}
              className="group flex items-center gap-2.5 transition-all duration-200 hover:translate-x-1.5 active:scale-[0.995]"
            >
              {/* Rank Block: Dark with team color accent border and subtle hover glow */}
              <div
                className="flex h-[56px] w-[52px] shrink-0 items-center justify-center rounded-lg border bg-[#121316] font-display text-base font-black text-white shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:border-white/50"
                style={{
                  borderColor: `${style.baseColor}66`,
                  boxShadow: `0 0 12px ${style.baseColor}15`,
                }}
              >
                {String(row.rank).padStart(2, "0")}
              </div>

              {/* Main Team Color Banner with subtle sweeps and interactive gleam */}
              <div
                className="relative flex h-[56px] flex-1 items-center overflow-hidden rounded-l-lg shadow-md transition-all duration-200 group-hover:brightness-105 group-hover:shadow-lg"
                style={{
                  background: style.gradient,
                  clipPath:
                    "polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)",
                  color: style.textColor,
                }}
              >
                {/* Chamfer corner accent notch */}
                <div
                  className="pointer-events-none absolute bottom-0 right-0 h-4 w-4"
                  style={{ background: style.notchColor }}
                  aria-hidden
                />

                {/* Staggered periodic subtle stadium light sweep */}
                <div
                  className="pointer-events-none absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-subtle-sweep"
                  style={{ animationDelay: `${i * 0.9}s` }}
                  aria-hidden
                />

                {/* Interactive cursor hover sheen sweep */}
                <div
                  className="pointer-events-none absolute inset-y-0 -left-[60%] w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[550%]"
                  aria-hidden
                />

                {/* Ambient pulse aura for the current tournament Leader */}
                {isLeader && (
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/5 opacity-50 animate-pulse"
                    aria-hidden
                  />
                )}

                <div className="relative z-10 grid h-full w-full grid-cols-[minmax(0,1.8fr)_minmax(0,1.4fr)_100px_90px] items-center px-6">
                  {/* Team Name */}
                  <div className="min-w-0 pr-3">
                    <span className="block truncate font-display text-base font-black tracking-wide uppercase sm:text-lg">
                      {row.team.name}
                    </span>
                    <span
                      className="block truncate text-[11px] font-semibold sm:hidden"
                      style={{ color: style.subColor }}
                    >
                      {row.team.affiliation}
                    </span>
                  </div>

                  {/* Affiliation */}
                  <div
                    className="hidden min-w-0 pr-3 text-xs font-semibold sm:block md:text-sm"
                    style={{ color: style.subColor }}
                  >
                    <span className="block truncate">
                      {row.team.affiliation || "Unaffiliated"}
                    </span>
                  </div>

                  {/* To Leader */}
                  <div className="text-right text-xs font-black tracking-wider uppercase sm:pr-4 md:text-sm">
                    {isLeader ? "LEADER" : `${formatPoints(row.toLeader)}`}
                  </div>

                  {/* Total Points */}
                  <div className="text-right font-display text-2xl font-black leading-none pr-1 sm:text-3xl transition-transform duration-200 group-hover:scale-105">
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
