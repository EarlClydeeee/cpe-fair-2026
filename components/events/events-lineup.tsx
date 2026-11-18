"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { EventCard } from "@/components/events/event-card";
import { HeroMatchBanner } from "@/components/events/hero-match-banner";
import { MatchDetailsDrawer } from "@/components/events/match-details-drawer";
import type { Category, FairEvent } from "@/lib/data/public";
import { pickFeaturedEvent } from "@/lib/events";
import { dayLabel, manilaDateKey } from "@/lib/format";
import { useNow } from "@/lib/hooks/use-now";

function tabClass(active: boolean) {
  return `whitespace-nowrap rounded-lg px-3.5 py-2.5 text-[11px] tracking-[0.12em] uppercase transition-colors duration-200 sm:px-4 sm:text-xs ${
    active
      ? "bg-accent text-black"
      : "bg-surface-2 text-muted hover:text-foreground"
  }`;
}

function dayClass(active: boolean) {
  return `whitespace-nowrap rounded-lg border px-3 py-2.5 text-[11px] uppercase transition-colors duration-200 sm:text-xs ${
    active
      ? "border-accent text-accent"
      : "border-border text-muted hover:text-foreground"
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
  const now = useNow(30_000);
  const [selectedEvent, setSelectedEvent] = useState<FairEvent | null>(null);

  const featured = useMemo(
    () => pickFeaturedEvent(events, now),
    [events, now],
  );

  const dayDates = useMemo(() => {
    const keys = Array.from(
      new Set(events.map((e) => manilaDateKey(e.start_at))),
    ).sort();
    return keys.length ? keys : [];
  }, [events]);

  const filtered = useMemo(() => {
    let rows = events;
    if (categorySlug) {
      rows = rows.filter((e) => e.categories?.slug === categorySlug);
    }
    if (day && dayDates[day - 1]) {
      const key = dayDates[day - 1];
      rows = rows.filter((e) => manilaDateKey(e.start_at) === key);
    }
    return rows;
  }, [events, categorySlug, day, dayDates]);

  const openDetails = useCallback((event: FairEvent) => {
    setSelectedEvent(event);
  }, []);

  const closeDetails = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  return (
    <>
      {featured ? (
        <HeroMatchBanner event={featured} now={now} onOpenDetails={openDetails} />
      ) : (
        <p className="text-muted">Events appear after the database is seeded.</p>
      )}

      <div className="mt-7 space-y-2.5 sm:mt-10 sm:space-y-3">
        <div className="-mx-4 scroll-rail-edge px-4 sm:mx-0 sm:px-0">
          <div className="scroll-rail flex-nowrap" aria-label="Event categories">
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
        </div>
        <div className="-mx-4 scroll-rail-edge px-4 sm:mx-0 sm:px-0">
          <div className="scroll-rail flex-nowrap" aria-label="Competition days">
            <Link
              href={`/events${categorySlug ? `?category=${categorySlug}` : ""}`}
              className={dayClass(!day)}
            >
              All dates
            </Link>
            {dayDates.map((_, index) => {
              const d = index + 1;
              return (
                <Link
                  key={dayDates[index]}
                  href={`/events?day=${d}${categorySlug ? `&category=${categorySlug}` : ""}`}
                  className={dayClass(day === d)}
                >
                  {dayLabel(d)}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <h2 className="mt-8 font-display text-2xl leading-none sm:mt-10 sm:text-3xl">
        The Competition Schedule
      </h2>

      {filtered.length ? (
        <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((event, i) => (
            <EventCard
              key={event.id}
              event={event}
              index={i}
              now={now}
              onOpenDetails={openDetails}
            />
          ))}
        </div>
      ) : (
        <p className="mt-6 text-muted">No events match these filters.</p>
      )}

      <MatchDetailsDrawer
        event={selectedEvent}
        open={Boolean(selectedEvent)}
        now={now}
        onClose={closeDetails}
      />
    </>
  );
}
