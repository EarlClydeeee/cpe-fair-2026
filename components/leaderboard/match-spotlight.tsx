"use client";

import Link from "next/link";
import type { FairEvent } from "@/lib/data/public";
import {
  eventWinnerLabel,
  getComputedEventStatus,
  pickFeaturedEvent,
} from "@/lib/events";
import { formatTime } from "@/lib/format";
import { useNow } from "@/lib/hooks/use-now";

/** Prefer highlighted, else ongoing, else soonest upcoming. Optionally prefer a category. */
export function pickSpotlight(
  events: FairEvent[],
  categorySlug?: string,
  now = new Date(),
): FairEvent | null {
  if (!events.length) return null;
  if (!categorySlug) return pickFeaturedEvent(events, now);

  const scoped = events.filter((e) => e.categories?.slug === categorySlug);
  return pickFeaturedEvent(scoped.length ? scoped : events, now);
}

export function MatchSpotlight({
  events,
  categorySlug,
}: {
  events: FairEvent[];
  categorySlug?: string;
}) {
  const now = useNow(30_000);
  const event = pickSpotlight(events, categorySlug, now);
  if (!event) return null;

  const status = getComputedEventStatus(event, now);
  const live = status === "ongoing";
  const matchup =
    event.team_a && event.team_b
      ? `${event.team_a.name} vs ${event.team_b.name}`
      : null;
  const winner = eventWinnerLabel(event);

  return (
    <div className="rounded-xl bg-accent p-5 text-black">
      <p className="text-[10px] font-semibold tracking-[0.18em] uppercase">
        Match spotlight ·{" "}
        {event.is_highlighted
          ? "Pinned"
          : live
            ? "Live now"
            : status === "ended"
              ? "Final"
              : "Up next"}
      </p>
      <h3 className="mt-3 font-display text-4xl leading-none uppercase">
        {event.categories?.name || event.name}
      </h3>
      {matchup ? (
        <p className="mt-2 text-sm font-medium">{matchup}</p>
      ) : (
        <p className="mt-2 text-sm font-medium">{event.name}</p>
      )}
      {winner ? <p className="mt-1 text-sm font-medium">{winner}</p> : null}
      <p className="mt-3 text-sm opacity-80">
        {event.venue} · {formatTime(event.start_at)} – {formatTime(event.end_at)}
      </p>
      <Link
        href={`/events/${event.id}`}
        className="mt-5 inline-flex rounded-lg bg-black px-4 py-2 text-sm text-white transition-opacity duration-200 hover:opacity-90"
      >
        View match details
      </Link>
    </div>
  );
}
