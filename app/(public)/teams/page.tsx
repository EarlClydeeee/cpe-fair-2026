import type { Metadata } from "next";
import Link from "next/link";
import { Placeholder } from "@/components/placeholder";
import { getStandings } from "@/lib/data/public";
import { formatPoints } from "@/lib/format";

export const metadata: Metadata = { title: "Teams" };

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
        <div className="text-right">
          <p className="text-xs tracking-[0.18em] text-accent uppercase">Fly high</p>
          <p className="font-display text-6xl text-accent sm:text-7xl">2026</p>
          <p className="text-xs tracking-[0.18em] text-muted uppercase">The next chapter</p>
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
            <option value="name">Sort: Name</option>
          </select>
          <button
            type="submit"
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-muted transition-colors duration-200 hover:text-foreground"
          >
            Apply
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {list.map((row) => (
          <article
            key={row.team.id}
            className="overflow-hidden rounded-xl border border-border bg-surface transition-colors duration-200 hover:border-accent/40"
          >
            <div className="relative">
              <Placeholder
                label={row.team.name}
                ratio="16/11"
                color={row.team.color_hex}
                className="rounded-none border-0"
              />
              <span className="absolute left-3 top-3 rounded-md bg-black/70 px-2 py-1 text-xs">
                #{String(row.rank).padStart(2, "0")}
              </span>
            </div>
            <div
              className="space-y-2 p-4"
              style={{ borderTop: `3px solid ${row.team.color_hex}` }}
            >
              <h2 className="font-display text-3xl">{row.team.name}</h2>
              <p className="text-xs text-muted">{row.team.affiliation}</p>
              <div className="flex items-end justify-between pt-2">
                <p className="font-display text-3xl">{formatPoints(row.total)} PTS</p>
                <Link
                  href={`/teams/${row.team.slug}`}
                  style={{ color: row.team.color_hex }}
                  className="text-sm transition-opacity duration-200 hover:opacity-80"
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
