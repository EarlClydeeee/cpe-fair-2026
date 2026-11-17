"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { FairEvent } from "@/lib/data/public";
import {
  eventPrimaryCta,
  eventStatusDisplay,
  eventStatusTone,
  eventSubtitle,
} from "@/lib/events";
import { formatDate, formatTime } from "@/lib/format";

export function EventCard({
  event,
  index,
  onOpenDetails,
}: {
  event: FairEvent;
  index: number;
  onOpenDetails: (event: FairEvent) => void;
}) {
  const cta = eventPrimaryCta(event.status);
  const resultsHref = event.categories?.slug
    ? `/leaderboard?category=${event.categories.slug}`
    : "/leaderboard";

  return (
    <article className="relative overflow-hidden rounded-xl border border-border bg-surface p-5 transition-colors duration-200 hover:border-accent/40">
      <span className="pointer-events-none absolute right-3 bottom-2 font-display text-6xl text-white/5">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs tracking-wide text-accent uppercase">
          {event.categories?.name}
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
      {cta.kind === "results" ? (
        <Link
          href={resultsHref}
          className="mt-4 inline-block text-sm text-accent transition-opacity duration-200 hover:opacity-80"
        >
          View results →
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => onOpenDetails(event)}
          className="mt-4 inline-block cursor-pointer text-sm text-accent transition-opacity duration-200 hover:opacity-80"
        >
          Match details →
        </button>
      )}
    </article>
  );
}
