"use client";

import Link from "next/link";
import type { FairEvent } from "@/lib/data/public";
import { pickFeaturedEvent } from "@/lib/events";

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

export function MatchSpotlight({ event }: { event: FairEvent }) {
  const categoryLabel = event.categories?.name || "SPORTS";
  const matchup =
    event.team_a && event.team_b
      ? { a: event.team_a.name, b: event.team_b.name }
      : { a: "KARASUNO", b: "NEKOMA" };

  return (
    <Link
      href={`/events/${event.id}`}
      className="group block rounded-xl bg-[#ff6a00] p-6 text-black shadow-lg shadow-orange-950/20 transition-all duration-200 hover:brightness-105"
    >
      <p className="text-[10px] font-black tracking-[0.18em] text-black uppercase">
        MATCH SPOTLIGHT
      </p>
      <p className="mt-0.5 text-[10px] font-bold tracking-[0.16em] text-black/80 uppercase">
        {categoryLabel} / SAMPLE MATCH
      </p>

      <h3 className="mt-3 font-display text-4xl font-black uppercase tracking-tight text-black sm:text-5xl">
        {event.title || "VOLLEYBALL"}
      </h3>

      <div className="mt-5 flex items-center justify-between font-display text-base font-black tracking-wide uppercase sm:text-lg">
        <span>{matchup.a}</span>
        <span className="text-xs font-semibold lowercase opacity-75">vs</span>
        <span>{matchup.b}</span>
      </div>
    </Link>
  );
}
