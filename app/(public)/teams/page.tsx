import type { Metadata } from "next";
import Link from "next/link";
import { TeamBanner } from "@/components/team-banner";
import { getStandings } from "@/lib/data/public";
import { formatPoints } from "@/lib/format";

export const metadata: Metadata = { title: "Teams" };
export const instant = false;

type Props = {
  searchParams: Promise<{ q?: string; sort?: string; affiliation?: string }>;
};

export default async function TeamsPage({ searchParams }: Props) {
  const { q, sort, affiliation } = await searchParams;
  const { rows, categories } = await getStandings();
  let list = rows;

  const affiliations = [
    ...new Set(
      rows
        .map((r) => r.team.affiliation.trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));

  if (affiliation) {
    list = list.filter((r) => r.team.affiliation === affiliation);
  }
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
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="reveal">
        <p className="text-[10px] tracking-[0.2em] text-accent uppercase sm:text-xs">
          Eight teams. One shared ambition.
        </p>
        <h1 className="mt-2 font-display text-4xl leading-none sm:text-6xl">
          Meet the Teams
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
          Different colors. The same fighting spirit. Meet the teams taking the court.
        </p>
      </div>

      <div className="dash-rule my-6 sm:my-8" />

      <div className="space-y-4 sm:space-y-5">
        <div className="grid grid-cols-3 gap-3 border-b border-border/60 pb-4 sm:flex sm:flex-wrap sm:gap-8 sm:border-0 sm:pb-0">
          {[
            [String(list.length).padStart(2, "0"), "Teams"],
            [String(categories.length).padStart(2, "0"), "Categories"],
            ["01", "Champion"],
          ].map(([value, label]) => (
            <div key={label}>
              <p className="font-display text-2xl text-accent sm:text-4xl">{value}</p>
              <p className="text-[10px] tracking-[0.18em] text-muted uppercase">{label}</p>
            </div>
          ))}
        </div>
        <form className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search teams..."
            className="col-span-2 min-h-11 w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none transition-colors duration-200 focus:border-accent sm:w-auto sm:min-w-[12rem]"
          />
          <select
            name="affiliation"
            defaultValue={affiliation ?? ""}
            className="min-h-11 w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm sm:w-auto"
          >
            <option value="">All sections</option>
            {affiliations.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select
            name="sort"
            defaultValue={sort ?? "rank"}
            className="min-h-11 w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm sm:w-auto"
          >
            <option value="rank">Sort: Rank</option>
            <option value="name">Sort: A–Z</option>
            <option value="points">Sort: Points</option>
          </select>
          <button
            type="submit"
            className="col-span-2 min-h-11 rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-sm text-muted transition-colors duration-200 hover:text-foreground sm:w-auto"
          >
            Apply
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {list.map((row) => (
          <article
            key={row.team.id}
            className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-all duration-200 hover:border-accent/40 hover:shadow-lg"
          >
            <div className="relative shrink-0">
              <TeamBanner
                name={row.team.name}
                colorHex={row.team.color_hex}
                artworkUrl={row.team.artwork_url}
                ratio="16/11"
                className="rounded-none border-0"
              />
              <span className="absolute top-3 left-3 rounded-md bg-black/75 px-2 py-1 font-mono text-xs text-white/90">
                #{String(row.rank).padStart(2, "0")}
              </span>
            </div>

            <div
              className="flex flex-1 flex-col justify-between p-4.5"
              style={{ borderTop: `3px solid ${row.team.color_hex}` }}
            >
              <div>
                <div className="flex h-14 items-center">
                  <h2 className="font-display text-xl leading-tight text-white uppercase sm:text-2xl line-clamp-2">
                    {row.team.name}
                  </h2>
                </div>

                <p className="mt-1 h-5 truncate text-xs text-muted">
                  {row.team.affiliation || "Unaffiliated"}
                </p>
              </div>

              <div className="mt-4 flex items-baseline justify-between border-t border-border/40 pt-3.5">
                <div className="flex min-w-0 items-baseline gap-1.5">
                  <span className="font-display text-2xl leading-none font-bold text-white">
                    {formatPoints(row.total)}
                  </span>
                  <span className="text-[11px] font-bold text-muted uppercase">PTS</span>
                </div>
                <Link
                  href={`/teams/${row.team.slug}`}
                  style={{ color: row.team.color_hex }}
                  className="shrink-0 text-xs font-semibold tracking-wider uppercase transition-opacity duration-200 hover:opacity-80"
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
