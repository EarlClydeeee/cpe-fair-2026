"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { EventCard } from "@/components/events/event-card";
import { EventsCalendar } from "@/components/events/events-calendar";
import { HeroMatchBanner } from "@/components/events/hero-match-banner";
import { MatchDetailsDrawer } from "@/components/events/match-details-drawer";
import type { Category, FairEvent } from "@/lib/data/public";
import { isValidDateKey } from "@/lib/calendar";
import { pickFeaturedEvent } from "@/lib/events";
import { manilaDateKey } from "@/lib/format";
import { useNow } from "@/lib/hooks/use-now";

function tabClass(active: boolean) {
  return `whitespace-nowrap rounded-lg px-3.5 py-2.5 text-[11px] tracking-[0.12em] uppercase transition-colors duration-200 sm:px-4 sm:text-xs ${
    active
      ? "bg-accent text-black"
      : "bg-surface-2 text-muted hover:text-foreground"
  }`;
}

export function EventsLineup({
  categories,
  events,
  categorySlug,
  date,
}: {
  categories: Category[];
  events: FairEvent[];
  categorySlug?: string;
  date?: string;
}) {
  const now = useNow(30_000);
  const [selectedEvent, setSelectedEvent] = useState<FairEvent | null>(null);
  const selectedDate = isValidDateKey(date) ? date : undefined;

  const featured = useMemo(
    () => pickFeaturedEvent(events, now),
    [events, now],
  );

  const categoryEvents = useMemo(() => {
    if (!categorySlug) return events;
    return events.filter((e) => e.categories?.slug === categorySlug);
  }, [events, categorySlug]);

  const filtered = useMemo(() => {
    if (!selectedDate) return categoryEvents;
    return categoryEvents.filter(
      (e) => manilaDateKey(e.start_at) === selectedDate,
    );
  }, [categoryEvents, selectedDate]);

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

      <div className="mt-7 sm:mt-10">
        <div className="-mx-4 scroll-rail-edge px-4 sm:mx-0 sm:px-0">
          <div className="scroll-rail flex-nowrap" aria-label="Event categories">
            <Link
              href={
                selectedDate ? `/events?date=${selectedDate}` : "/events"
              }
              className={tabClass(!categorySlug)}
            >
              All events
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={
                  selectedDate
                    ? `/events?category=${cat.slug}&date=${selectedDate}`
                    : `/events?category=${cat.slug}`
                }
                className={tabClass(categorySlug === cat.slug)}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-7 sm:mt-10">
        <EventsCalendar
          events={categoryEvents}
          selectedDate={selectedDate}
          categorySlug={categorySlug}
        />
      </div>

      <h2 className="mt-8 font-display text-2xl leading-none sm:mt-10 sm:text-3xl">
        The Competition Schedule
        {selectedDate ? (
          <span className="mt-2 block font-sans text-sm font-normal tracking-normal text-muted normal-case">
            Showing {selectedDate}
          </span>
        ) : null}
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
