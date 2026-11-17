import type { Metadata } from "next";
import Link from "next/link";
import { TeamBanner } from "@/components/team-banner";
import { getStandings } from "@/lib/data/public";
import { formatPoints } from "@/lib/format";

export const metadata: Metadata = { title: "Teams" };
export const instant = false;

type Props = { searchParams: Promise<{ q?: string; sort?: string }> };

export default async function TeamsPage({ searchParams }: Props) {
  const { q, sort } = await searchParams;
  const { rows, categories } = await getStandings();
  let list = rows;
  if (q) {
    const needle = q.toLowerCase();
    list = list.filter(
      (r) =>
        r.team.name.toLowerCase().includes(needle) ||
        r.team.affiliation.toLowerCase().includes(needle),
    );
  }
  if (sort === "name") {
    list = [...list].sort((a, b) => a.team.name.localeCompare(b.team.name));
  } else if (sort === "points" || sort === "rank" || !sort) {
    list = [...list].sort(
      (a, b) => b.total - a.total || a.team.sort_order - b.team.sort_order,
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="reveal">
          <p className="text-xs tracking-[0.2em] text-accent uppercase">
            Eight teams. One shared ambition.
          </p>
          <h1 className="mt-2 font-display text-5xl sm:text-6xl">Meet the Teams</h1>
          <p className="mt-3 max-w-xl text-sm text-muted">
            Different colors. The same fighting spirit. Meet the teams taking the court.
          </p>
        </div>
      </div>

      <div className="dash-rule my-8" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-8">
          {[
            [String(list.length).padStart(2, "0"), "Teams"],
            [String(categories.length).padStart(2, "0"), "Categories"],
            ["01", "Champion"],
          ].map(([value, label]) => (
            <div key={label}>
              <p className="font-display text-3xl text-accent sm:text-4xl">{value}</p>
              <p className="text-[10px] tracking-[0.18em] text-muted uppercase">{label}</p>
            </div>
          ))}
        </div>
        <form className="flex flex-wrap gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search teams..."
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none transition-colors duration-200 focus:border-accent"
          />
          <select
            name="sort"
            defaultValue={sort ?? "rank"}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm"
          >
            <option value="rank">Sort: Overall rank</option>
            <option value="name">Sort: Alphabetical</option>
            <option value="points">Sort: Points</option>
          </select>
          <button
            type="submit"
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-muted transition-colors duration-200 hover:text-foreground"
          >
            Apply
          </button>
        </form>
      </div>

      {/* Grid of Team Cards with Guaranteed Uniform Height and Alignment */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {list.map((row) => (
          <article
            key={row.team.id}
            className="flex flex-col h-full overflow-hidden rounded-xl border border-border bg-surface transition-all duration-200 hover:border-accent/40 hover:shadow-lg"
          >
            {/* Top Banner with Rank Badge */}
            <div className="relative shrink-0">
              <TeamBanner
                name={row.team.name}
                colorHex={row.team.color_hex}
                artworkUrl={row.team.artwork_url}
                ratio="16/11"
                className="rounded-none border-0"
              />
              <span className="absolute left-3 top-3 rounded-md bg-black/75 px-2 py-1 text-xs font-mono text-white/90">
                #{String(row.rank).padStart(2, "0")}
              </span>
            </div>

            {/* Bottom Content Area with Consistent Vertical Slots */}
            <div
              className="flex flex-1 flex-col justify-between p-4.5"
              style={{ borderTop: `3px solid ${row.team.color_hex}` }}
            >
              <div>
                {/* Fixed-height Team Name slot (56px) - aligns short & long names uniformly */}
                <div className="flex h-14 items-center">
                  <h2 className="font-display text-xl sm:text-2xl leading-tight line-clamp-2 uppercase text-white">
                    {row.team.name}
                  </h2>
                </div>

                {/* Fixed-height Affiliation slot (20px) */}
                <p className="mt-1 h-5 text-xs text-muted truncate">
                  {row.team.affiliation || "Unaffiliated"}
                </p>
              </div>

              {/* Bottom Footer pinned at bottom with aligned baseline */}
              <div className="mt-4 pt-3.5 border-t border-border/40 flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="font-display text-2xl font-bold leading-none text-white">
                    {formatPoints(row.total)}
                  </span>
                  <span className="text-[11px] font-bold text-muted uppercase">PTS</span>
                </div>
                <Link
                  href={`/teams/${row.team.slug}`}
                  style={{ color: row.team.color_hex }}
                  className="text-xs font-semibold uppercase tracking-wider shrink-0 transition-opacity duration-200 hover:opacity-80"
                >
                  View team →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
