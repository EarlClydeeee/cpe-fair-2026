"use client";

import Link from "next/link";
import type { FairEvent } from "@/lib/data/public";
import {
  eventMatchupLabel,
  eventStatusDisplay,
  getComputedEventStatus,
  pickFeaturedEvent,
} from "@/lib/events";
import { useNow } from "@/lib/hooks/use-now";

/** Prefer highlighted, else ongoing, else soonest upcoming. Optionally prefer a category. */
export function pickSpotlight(
  events: FairEvent[],
  categorySlug: string | undefined,
  now: Date,
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
  const now = useNow();
  const event = pickSpotlight(events, categorySlug, now);
  if (!event) return null;

  const categoryLabel = event.categories?.name || "Event";
  const status = getComputedEventStatus(event, now);
  const matchup = eventMatchupLabel(event);
  const isHeadToHead = event.match_type === "head_to_head" || Boolean(matchup);

  return (
    <Link
      href="/events"
      className="group block rounded-xl bg-[#ff6a00] p-4 text-black shadow-lg shadow-orange-950/20 transition-[filter] duration-200 hover:brightness-105 sm:p-6"
    >
      <p className="text-[10px] font-black tracking-[0.18em] text-black uppercase">
        Match spotlight
      </p>
      <p className="mt-0.5 text-[10px] font-bold tracking-[0.16em] text-black/80 uppercase">
        {categoryLabel} / {eventStatusDisplay(status)}
      </p>

      <h3 className="mt-2.5 font-display text-3xl font-black tracking-tight text-black uppercase sm:mt-3 sm:text-5xl">
        {event.name}
      </h3>

      {isHeadToHead ? (
        <div className="mt-4 flex items-center justify-between gap-2 font-display text-sm font-black tracking-wide uppercase sm:mt-5 sm:text-lg">
          <span className="min-w-0 truncate">{event.team_a?.name ?? "TBD"}</span>
          <span className="shrink-0 text-xs font-semibold lowercase opacity-75">vs</span>
          <span className="min-w-0 truncate text-right">{event.team_b?.name ?? "TBD"}</span>
        </div>
      ) : (
        <p className="mt-4 font-display text-sm font-black tracking-wide uppercase sm:mt-5 sm:text-lg">
          {event.match_format?.trim() || "All eight teams"}
        </p>
      )}
    </Link>
  );
}
