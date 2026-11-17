import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Badge } from "@/components/ui/badge";
import { getEvent } from "@/lib/data/public";
import {
  eventFormat,
  eventMatchupLabel,
  eventPrimaryCta,
  eventStatusDisplay,
  eventStatusTone,
  eventWinnerLabel,
  getComputedEventStatus,
} from "@/lib/events";
import { formatEventWindow } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

export const instant = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  return { title: event?.name ?? "Event" };
}

export default async function EventDetailPage({ params }: Props) {
  await connection();
  const now = new Date();
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const status = getComputedEventStatus(event, now);
  const matchup = eventMatchupLabel(event);
  const format = eventFormat(event);
  const winner = eventWinnerLabel(event);
  const cta = eventPrimaryCta(status);
  const resultsHref = event.categories?.slug
    ? `/leaderboard?category=${event.categories.slug}`
    : "/leaderboard";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-12">
      <Link href="/events" className="text-sm text-muted hover:text-accent">
        ← Back to events
      </Link>
      <div className="mt-5 flex flex-wrap gap-2 sm:mt-6">
        {event.categories?.name ? (
          <Badge tone="accent">{event.categories.name}</Badge>
        ) : null}
        {event.is_highlighted ? <Badge tone="accent">Spotlight</Badge> : null}
        <Badge tone={eventStatusTone(status)}>
          {eventStatusDisplay(status)}
        </Badge>
      </div>
      <h1 className="mt-4 font-display text-4xl leading-none sm:text-5xl">
        {event.name}
      </h1>
      {matchup ? (
        <div className="mt-4 space-y-1 sm:space-y-0">
          <p className="grid gap-1 font-display text-lg tracking-wide sm:hidden">
            {event.team_a ? (
              <Link
                href={`/teams/${event.team_a.slug}`}
                className="text-foreground transition-colors duration-200 hover:text-accent"
              >
                {event.team_a.name}
              </Link>
            ) : (
              <span>TBD</span>
            )}
            <span className="text-[10px] font-bold tracking-[0.2em] text-muted uppercase">
              versus
            </span>
            {event.team_b ? (
              <Link
                href={`/teams/${event.team_b.slug}`}
                className="text-foreground transition-colors duration-200 hover:text-accent"
              >
                {event.team_b.name}
              </Link>
            ) : (
              <span>TBD</span>
            )}
          </p>
          <p className="hidden text-muted sm:block">
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
        </div>
      ) : (
        <p className="mt-4 text-muted">
          {event.match_format || "All eight teams"}
        </p>
      )}
      {winner ? <p className="mt-3 text-sm text-info">{winner}</p> : null}
      {event.result_note ? (
        <p className="mt-1 text-sm text-muted">{event.result_note}</p>
      ) : null}
      <dl className="mt-7 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <dt className="text-[10px] tracking-wide text-muted uppercase">When</dt>
          <dd className="mt-1 font-medium">
            {formatEventWindow(event.start_at, event.end_at)}
          </dd>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <dt className="text-[10px] tracking-wide text-muted uppercase">Venue</dt>
          <dd className="mt-1 font-medium">{event.venue || "TBA"}</dd>
        </div>
        {format ? (
          <div className="rounded-xl border border-border bg-surface p-4 sm:col-span-2">
            <dt className="text-[10px] tracking-wide text-muted uppercase">
              Format
            </dt>
            <dd className="mt-1 font-medium">{format}</dd>
          </div>
        ) : null}
      </dl>
      {cta.kind === "results" ? (
        <Link
          href={resultsHref}
          className="mt-7 inline-flex min-h-11 items-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black transition-opacity duration-200 hover:opacity-90 sm:mt-8"
        >
          View results
        </Link>
      ) : null}
    </div>
  );
}
