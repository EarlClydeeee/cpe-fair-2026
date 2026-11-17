"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { FairEvent } from "@/lib/data/public";
import {
  eventPrimaryCta,
  eventStatusDisplay,
  eventStatusTone,
  eventSubtitle,
  eventWinnerLabel,
  getComputedEventStatus,
} from "@/lib/events";
import { formatDate, formatTime } from "@/lib/format";

export function EventCard({
  event,
  index,
  now = new Date(),
  onOpenDetails,
}: {
  event: FairEvent;
  index: number;
  now?: Date;
  onOpenDetails: (event: FairEvent) => void;
}) {
  const status = getComputedEventStatus(event, now);
  const cta = eventPrimaryCta(status);
  const winner = eventWinnerLabel(event);
  const resultsHref = event.categories?.slug
    ? `/leaderboard?category=${event.categories.slug}`
    : "/leaderboard";

  return (
    <article className="relative overflow-hidden rounded-xl border border-border bg-surface transition-colors duration-200 hover:border-accent/40">
      <div className="flex items-stretch">
        <div className="hidden w-[4.25rem] shrink-0 flex-col justify-center border-r border-border bg-background/40 px-2.5 py-4 text-center sm:flex">
          <p className="font-display text-lg leading-none text-foreground">
            {formatTime(event.start_at)}
          </p>
          <p className="mt-1.5 text-[9px] tracking-[0.14em] text-muted uppercase">
            {formatDate(event.start_at)}
          </p>
        </div>

        <div className="relative min-w-0 flex-1 p-4 sm:p-5">
          <span className="pointer-events-none absolute right-2.5 bottom-1 font-display text-5xl text-white/[0.04] sm:text-6xl">
            {String(index + 1).padStart(2, "0")}
          </span>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] tracking-[0.16em] text-accent uppercase">
                {event.categories?.name}
              </p>
              <p className="mt-1 text-[10px] tracking-[0.12em] text-muted uppercase sm:hidden">
                {formatDate(event.start_at)} · {formatTime(event.start_at)}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-1">
              {event.is_highlighted ? <Badge tone="accent">Spotlight</Badge> : null}
              <Badge tone={eventStatusTone(status)}>
                {eventStatusDisplay(status)}
              </Badge>
            </div>
          </div>

          <h3 className="mt-3 font-display text-2xl leading-none tracking-wide sm:text-3xl">
            {event.name}
          </h3>
          <p className="mt-2 text-sm leading-5 text-muted">{eventSubtitle(event)}</p>
          {winner ? <p className="mt-2 text-sm text-info">{winner}</p> : null}
          {event.result_note ? (
            <p className="mt-1 text-xs text-muted">{event.result_note}</p>
          ) : null}

          <div className="mt-4 flex items-end justify-between gap-3">
            <p className="min-w-0 truncate text-xs text-muted">
              {event.venue || "Venue TBA"}
            </p>
            {cta.kind === "results" ? (
              <Link
                href={resultsHref}
                className="shrink-0 text-sm text-accent transition-opacity duration-200 hover:opacity-80"
              >
                Results →
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => onOpenDetails(event)}
                className="shrink-0 cursor-pointer text-sm text-accent transition-opacity duration-200 hover:opacity-80"
              >
                Details →
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
