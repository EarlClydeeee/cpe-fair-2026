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
        <div>
          <p className="text-xs tracking-[0.2em] text-accent uppercase">
            Eight teams. One shared ambition.
          </p>
          <h1 className="mt-2 font-display text-5xl sm:text-6xl">Meet the Teams</h1>
          <p className="mt-3 max-w-xl text-sm text-muted">
            Different colors. The same fighting spirit. Meet the teams taking the court.
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-6xl text-accent">2026</p>
          <p className="text-xs tracking-[0.18em] text-muted uppercase">Fly high. The next chapter.</p>
        </div>
      </div>

      <div className="dash-rule my-8" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-6 font-display text-2xl text-accent">
          <span>{String(list.length).padStart(2, "0")} Teams</span>
          <span>{String(categories.length).padStart(2, "0")} Categories</span>
          <span>01 Champion</span>
        </div>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search teams..."
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <select
            name="sort"
            defaultValue={sort ?? "rank"}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm"
          >
            <option value="rank">Sort: Overall rank</option>
            <option value="name">Sort: Name</option>
          </select>
          <button type="submit" className="rounded-lg bg-surface-2 px-3 text-sm text-muted">
            Apply
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {list.map((row) => (
          <article key={row.team.id} className="overflow-hidden rounded-2xl border border-border bg-surface">
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
            <div className="space-y-2 p-4" style={{ borderTop: `3px solid ${row.team.color_hex}` }}>
              <h2 className="font-display text-3xl">{row.team.name}</h2>
              <p className="text-xs text-muted">{row.team.affiliation}</p>
              <div className="flex items-end justify-between pt-2">
                <p className="font-display text-3xl">{formatPoints(row.total)} PTS</p>
                <Link href={`/teams/${row.team.slug}`} style={{ color: row.team.color_hex }} className="text-sm">
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
