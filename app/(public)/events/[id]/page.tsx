import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getEvent } from "@/lib/data/public";
import {
  eventFormat,
  eventMatchupLabel,
  eventPrimaryCta,
  eventStatusDisplay,
  eventStatusTone,
} from "@/lib/events";
import { formatDateTime } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  return { title: event?.title ?? "Event" };
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const matchup = eventMatchupLabel(event);
  const format = eventFormat(event);
  const cta = eventPrimaryCta(event.status);
  const resultsHref = event.categories?.slug
    ? `/leaderboard?category=${event.categories.slug}`
    : "/leaderboard";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/events" className="text-sm text-muted hover:text-accent">
        ← Back to events
      </Link>
      <div className="mt-6 flex flex-wrap gap-2">
        {event.categories?.name ? (
          <Badge tone="accent">{event.categories.name}</Badge>
        ) : null}
        <Badge tone={eventStatusTone(event.status)}>
          {eventStatusDisplay(event.status)}
        </Badge>
      </div>
      <h1 className="mt-4 font-display text-5xl">{event.title}</h1>
      {matchup ? (
        <p className="mt-4 text-muted">
          {event.team_a ? (
            <Link
              href={`/teams/${event.team_a.slug}`}
              className="text-foreground transition-colors duration-200 hover:text-accent"
            >
              {event.team_a.name}
            </Link>
          ) : null}
          <span> vs </span>
          {event.team_b ? (
            <Link
              href={`/teams/${event.team_b.slug}`}
              className="text-foreground transition-colors duration-200 hover:text-accent"
            >
              {event.team_b.name}
            </Link>
          ) : null}
        </p>
      ) : (
        <p className="mt-4 text-muted">{event.notes || "All eight teams"}</p>
      )}
      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <dt className="text-[10px] tracking-wide text-muted uppercase">When</dt>
          <dd className="mt-1 font-medium">
            {formatDateTime(event.starts_at)}
          </dd>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <dt className="text-[10px] tracking-wide text-muted uppercase">Venue</dt>
          <dd className="mt-1 font-medium">{event.venue || "TBA"}</dd>
        </div>
        {format ? (
          <div className="rounded-xl border border-border bg-surface p-4 sm:col-span-2">
            <dt className="text-[10px] tracking-wide text-muted uppercase">Format</dt>
            <dd className="mt-1 font-medium">{format}</dd>
          </div>
        ) : null}
      </dl>
      {cta.kind === "results" ? (
        <Link
          href={resultsHref}
          className="mt-8 inline-flex rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black transition-opacity duration-200 hover:opacity-90"
        >
          View results
        </Link>
      ) : null}
    </div>
  );
}
