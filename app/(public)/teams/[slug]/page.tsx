import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { TeamBanner } from "@/components/team-banner";
import { Badge } from "@/components/ui/badge";
import { getEventsForTeam, getStandings, getTeamBySlug } from "@/lib/data/public";
import {
  eventStatusDisplay,
  eventStatusTone,
  eventSubtitle,
  getComputedEventStatus,
} from "@/lib/events";
import { formatDateManila, formatPoints, formatTime } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export const instant = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const team = await getTeamBySlug(slug);
  return { title: team?.name ?? "Team" };
}

export default async function TeamDetailPage({ params }: Props) {
  await connection();
  const now = new Date();
  const { slug } = await params;
  const team = await getTeamBySlug(slug);
  if (!team) notFound();

  const [{ categories, rows }, matches] = await Promise.all([
    getStandings(),
    getEventsForTeam(team.id),
  ]);
  const standing = rows.find((r) => r.team.id === team.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-12">
      <Link
        href="/teams"
        className="text-sm text-muted transition-colors duration-200 hover:text-accent"
      >
        ← Back to teams
      </Link>

      <div className="mt-5 grid gap-6 lg:mt-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
        <TeamBanner
          name={team.name}
          colorHex={team.color_hex}
          artworkUrl={team.artwork_url}
          ratio="16/10"
          className="rounded-xl"
        />
        <div>
          <p className="text-[10px] tracking-[0.18em] text-muted uppercase sm:text-xs">
            {team.affiliation}
          </p>
          <h1
            className="mt-2 font-display text-4xl leading-none sm:text-5xl"
            style={{ color: team.color_hex }}
          >
            {team.name}
          </h1>
          <div className="mt-4 flex items-end justify-between gap-4 sm:mt-5 sm:block">
            <p className="font-display text-4xl leading-none sm:text-5xl">
              {formatPoints(standing?.total ?? 0)}
              <span className="ml-2 text-sm tracking-[0.16em] text-muted">PTS</span>
            </p>
            <p className="text-sm text-muted sm:mt-1">
              Overall rank #{String(standing?.rank ?? "—").padStart(2, "0")}
            </p>
          </div>

          <div className="dash-rule my-6 sm:my-8" />

          <p className="text-[10px] tracking-[0.16em] text-muted uppercase">
            Category breakdown
          </p>
          <div className="mt-3 space-y-2 sm:mt-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-3.5 py-2.5 sm:px-4 sm:py-3"
              >
                <span className="text-sm">{cat.name}</span>
                <span className="font-display text-xl sm:text-2xl">
                  {formatPoints(standing?.byCategory[cat.slug] ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="mt-10 sm:mt-12">
        <p className="text-[10px] tracking-[0.16em] text-muted uppercase">Match history</p>
        <h2 className="mt-2 font-display text-3xl leading-none sm:text-4xl">
          View team breakdown
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          Matches this team is in, plus all-team events that count toward the season.
        </p>

        {matches.length ? (
          <div className="mt-5 grid gap-3 sm:mt-6 md:grid-cols-2">
            {matches.map((event) => {
              const status = getComputedEventStatus(event, now);
              return (
                <article
                  key={event.id}
                  className="rounded-xl border border-border bg-surface p-4 transition-colors duration-200 hover:border-accent/40 sm:p-5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] tracking-[0.14em] text-accent uppercase sm:text-xs">
                      {event.categories?.name ?? "Event"}
                    </p>
                    <Badge tone={eventStatusTone(status)}>
                      {eventStatusDisplay(status)}
                    </Badge>
                  </div>
                  <h3 className="mt-3 font-display text-2xl leading-none sm:text-3xl">
                    {event.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted">{eventSubtitle(event)}</p>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <p className="min-w-0 truncate text-xs text-muted">
                      {formatDateManila(event.start_at)} · {formatTime(event.start_at)} ·{" "}
                      {event.venue}
                    </p>
                    <Link
                      href={`/events/${event.id}`}
                      className="shrink-0 text-sm text-accent transition-opacity duration-200 hover:opacity-80"
                    >
                      Details →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted">
            No matches scheduled for this team yet.
          </p>
        )}
      </section>
    </div>
  );
}
