"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { EventCard } from "@/components/events/event-card";
import { HeroMatchBanner } from "@/components/events/hero-match-banner";
import { MatchDetailsDrawer } from "@/components/events/match-details-drawer";
import type { Category, FairEvent } from "@/lib/data/public";
import { pickFeaturedEvent } from "@/lib/events";
import { dayLabel } from "@/lib/format";

function tabClass(active: boolean) {
  return `rounded-lg px-4 py-2 text-xs tracking-[0.12em] uppercase transition-colors duration-200 ${
    active
      ? "bg-accent text-black"
      : "bg-surface-2 text-muted hover:text-foreground"
  }`;
}

export function EventsLineup({
  categories,
  events,
  categorySlug,
  day,
}: {
  categories: Category[];
  events: FairEvent[];
  categorySlug?: string;
  day?: number;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const featured = useMemo(() => pickFeaturedEvent(events), [events]);

  const filtered = useMemo(() => {
    let rows = events;
    if (categorySlug) {
      rows = rows.filter((e) => e.categories?.slug === categorySlug);
    }
    if (day) {
      rows = rows.filter((e) => e.day_number === day);
    }
    return rows;
  }, [events, categorySlug, day]);

  const dayNumbers = useMemo(() => {
    const max = events.reduce((m, e) => Math.max(m, e.day_number), 0);
    const count = Math.max(max, 2);
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [events]);

  const selected = selectedId
    ? (events.find((e) => e.id === selectedId) ?? null)
    : null;

  const openDetails = useCallback((event: FairEvent) => {
    setSelectedId(event.id);
  }, []);

  const closeDetails = useCallback(() => {
    setSelectedId(null);
  }, []);

  return (
    <>
      {featured ? (
        <HeroMatchBanner event={featured} onOpenDetails={openDetails} />
      ) : (
        <p className="text-muted">Events appear after the database is seeded.</p>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Link
            href={day ? `/events?day=${day}` : "/events"}
            className={tabClass(!categorySlug)}
          >
            All events
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/events?category=${cat.slug}${day ? `&day=${day}` : ""}`}
              className={tabClass(categorySlug === cat.slug)}
            >
              {cat.name}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link
            href={`/events${categorySlug ? `?category=${categorySlug}` : ""}`}
            className={`rounded-lg border px-3 py-2 uppercase transition-colors duration-200 ${
              !day
                ? "border-accent text-accent"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            Day: All
          </Link>
          {dayNumbers.map((d) => (
            <Link
              key={d}
              href={`/events?day=${d}${categorySlug ? `&category=${categorySlug}` : ""}`}
              className={`rounded-lg border px-3 py-2 uppercase transition-colors duration-200 ${
                day === d
                  ? "border-accent text-accent"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              {dayLabel(d)}
            </Link>
          ))}
        </div>
      </div>

      <h2 className="mt-10 font-display text-3xl">The Competition Schedule</h2>

      {filtered.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((event, i) => (
            <EventCard
              key={event.id}
              event={event}
              index={i}
              onOpenDetails={openDetails}
            />
          ))}
        </div>
      ) : (
        <p className="mt-6 text-muted">No events match these filters.</p>
      )}

      <MatchDetailsDrawer
        event={selected}
        open={Boolean(selected)}
        onClose={closeDetails}
      />
    </>
  );
}
