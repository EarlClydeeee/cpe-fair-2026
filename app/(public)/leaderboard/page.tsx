import type { Metadata } from "next";
import Link from "next/link";
import { Placeholder } from "@/components/placeholder";
import { Badge } from "@/components/ui/badge";
import { getEvents, getStandings } from "@/lib/data/public";
import { formatPoints, formatTime } from "@/lib/format";

export const metadata: Metadata = { title: "Leaderboard" };

type Props = { searchParams: Promise<{ category?: string }> };

const podiumCopy = ["Leading the flight", "The chase is on", "Eyes on the top"];

function tabClass(active: boolean) {
  return `rounded-lg px-4 py-2 text-xs tracking-[0.12em] uppercase transition-colors duration-200 ${
    active
      ? "bg-accent text-black"
      : "bg-surface-2 text-muted hover:text-foreground"
  }`;
}

export default async function LeaderboardPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const [{ categories, rows }, events] = await Promise.all([
    getStandings(category),
    getEvents(),
  ]);
  const top3 = rows.slice(0, 3);
  const spotlight = events.find((e) => e.status === "upcoming") ?? events[0];
  const lead = rows[0] && rows[1] ? rows[0].total - rows[1].total : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="reveal">
          <p className="text-xs tracking-[0.2em] text-accent uppercase">Eight teams. One court.</p>
          <h1 className="mt-2 font-display text-5xl sm:text-6xl">Overall Leaderboard</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            Every point counts. Follow the teams rising to the top of ACCESS CPE Fair 2026.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs tracking-[0.18em] text-accent uppercase">Fly high</p>
          <p className="font-display text-6xl text-accent sm:text-7xl">2026</p>
          <p className="text-xs tracking-[0.18em] text-muted uppercase">The next chapter</p>
        </div>
      </div>

      <div className="dash-rule my-8" />

      <div className="flex flex-wrap gap-2">
        <Link href="/leaderboard" className={tabClass(!category)}>
          Overall
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/leaderboard?category=${cat.slug}`}
            className={tabClass(category === cat.slug)}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-[1.7fr_0.9fr]">
        <div className="space-y-8">
          {top3.length ? (
            <div className="grid gap-4 md:grid-cols-3">
              {top3.map((row, i) => (
                <article
                  key={row.team.id}
                  className="overflow-hidden rounded-xl border border-border bg-surface transition-colors duration-200 hover:border-accent/40"
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
                    <h2 className="font-display text-3xl">{row.team.name}</h2>
                    <p className="text-xs tracking-[0.12em] text-muted uppercase">
                      {podiumCopy[i]}
                    </p>
                    <p className="font-display text-4xl">{formatPoints(row.total)} PTS</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-muted">Standings appear after the database is seeded.</p>
          )}

          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="grid grid-cols-[56px_1.4fr_1fr_100px_90px] gap-2 border-b border-border px-4 py-3 text-[10px] tracking-[0.16em] text-muted uppercase">
              <span>Rank</span>
              <span>Team</span>
              <span>Affiliation</span>
              <span>Points</span>
              <span>To leader</span>
            </div>
            {rows.map((row) => (
              <Link
                key={row.team.id}
                href={`/teams/${row.team.slug}`}
                className="grid grid-cols-[56px_1.4fr_1fr_100px_90px] items-center gap-2 border-b border-border/60 px-4 py-3 transition-colors duration-200 hover:bg-surface-2"
              >
                <span className="font-mono text-sm text-muted">
                  {String(row.rank).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <span className="block truncate font-medium">{row.team.name}</span>
                  <span
                    className="mt-1 block h-0.5 w-10 rounded-full"
                    style={{ background: row.team.color_hex }}
                  />
                </div>
                <span className="truncate text-sm text-muted">{row.team.affiliation}</span>
                <span className="font-display text-xl">{formatPoints(row.total)}</span>
                <span className="text-sm text-muted">
                  {row.toLeader === 0 ? "—" : row.toLeader}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          {spotlight ? (
            <div className="rounded-xl bg-accent p-5 text-black">
              <p className="text-[10px] font-semibold tracking-[0.18em] uppercase">
                Match spotlight
              </p>
              <h3 className="mt-3 font-display text-3xl leading-none">
                {spotlight.title}
                {spotlight.team_a && spotlight.team_b
                  ? `: ${spotlight.team_a.name} vs ${spotlight.team_b.name}`
                  : ""}
              </h3>
              <p className="mt-3 text-sm">
                {spotlight.venue} · {formatTime(spotlight.starts_at)}
              </p>
              <Link
                href={`/events/${spotlight.id}`}
                className="mt-5 inline-flex rounded-lg bg-black px-4 py-2 text-sm text-white transition-opacity duration-200 hover:opacity-90"
              >
                View match details
              </Link>
            </div>
          ) : null}
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-[10px] tracking-[0.18em] text-muted uppercase">The title race</p>
            <p className="mt-3 font-display text-4xl text-accent">{lead} POINT LEAD</p>
            <p className="mt-2 text-sm text-muted">{categories.length} categories in play</p>
          </div>
          <div className="rounded-xl border border-dashed border-border p-4 text-xs leading-5 text-muted">
            A preview of the climb. Scores and matchups shown are illustrative until live scoring
            begins.
          </div>
        </aside>
      </div>
    </div>
  );
}
