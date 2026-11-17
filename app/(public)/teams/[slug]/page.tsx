import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TeamBanner } from "@/components/team-banner";
import { Badge } from "@/components/ui/badge";
import { getEventsForTeam, getStandings, getTeamBySlug } from "@/lib/data/public";
import {
  eventStatusDisplay,
  eventStatusTone,
  eventSubtitle,
} from "@/lib/events";
import { formatDate, formatPoints, formatTime } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const team = await getTeamBySlug(slug);
  return { title: team?.name ?? "Team" };
}

export default async function TeamDetailPage({ params }: Props) {
  const { slug } = await params;
  const team = await getTeamBySlug(slug);
  if (!team) notFound();

  const [{ categories, rows }, matches] = await Promise.all([
    getStandings(),
    getEventsForTeam(team.id),
  ]);
  const standing = rows.find((r) => r.team.id === team.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Link
        href="/teams"
        className="text-sm text-muted transition-colors duration-200 hover:text-accent"
      >
        ← Back to teams
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <TeamBanner
          name={team.name}
          colorHex={team.color_hex}
          artworkUrl={team.artwork_url}
          ratio="1/1"
          className="rounded-xl"
        />
        <div>
          <p className="text-xs tracking-[0.18em] text-muted uppercase">
            {team.affiliation}
          </p>
          <h1 className="mt-2 font-display text-5xl" style={{ color: team.color_hex }}>
            {team.name}
          </h1>
          <p className="mt-4 font-display text-5xl">
            {formatPoints(standing?.total ?? 0)} PTS
          </p>
          <p className="mt-1 text-sm text-muted">
            Overall rank #{String(standing?.rank ?? "—").padStart(2, "0")}
          </p>

          <div className="dash-rule my-8" />

          <p className="text-[10px] tracking-[0.16em] text-muted uppercase">
            Category breakdown
          </p>
          <div className="mt-4 space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
              >
                <span className="text-sm">{cat.name}</span>
                <span className="font-display text-2xl">
                  {formatPoints(standing?.byCategory[cat.slug] ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="mt-12">
        <p className="text-[10px] tracking-[0.16em] text-muted uppercase">Match history</p>
        <h2 className="mt-2 font-display text-4xl">View team breakdown</h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Matches this team is in, plus all-team events that count toward the season.
        </p>

        {matches.length ? (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {matches.map((event) => (
              <article
                key={event.id}
                className="rounded-xl border border-border bg-surface p-5 transition-colors duration-200 hover:border-accent/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs tracking-wide text-accent uppercase">
                    {event.categories?.name ?? "Event"}
                  </p>
                  <Badge tone={eventStatusTone(event.status)}>
                    {eventStatusDisplay(event.status)}
                  </Badge>
                </div>
                <h3 className="mt-3 font-display text-3xl">{event.title}</h3>
                <p className="mt-2 text-sm text-muted">{eventSubtitle(event)}</p>
                <p className="mt-4 text-xs text-muted">
                  {formatDate(event.starts_at)} · {formatTime(event.starts_at)} · {event.venue}
                </p>
                <Link
                  href={`/events/${event.id}`}
                  className="mt-4 inline-block text-sm text-accent transition-opacity duration-200 hover:opacity-80"
                >
                  Match details →
                </Link>
              </article>
            ))}
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
