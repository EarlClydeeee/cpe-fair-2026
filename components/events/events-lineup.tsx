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

  const categoryHref = (slug?: string) => {
    const params = new URLSearchParams();
    if (slug) params.set("category", slug);
    if (selectedDate) params.set("date", selectedDate);
    const q = params.toString();
    return q ? `/events?${q}` : "/events";
  };

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
            <Link href={categoryHref()} className={tabClass(!categorySlug)}>
              All events
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={categoryHref(cat.slug)}
                className={tabClass(categorySlug === cat.slug)}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Tablet / phone: calendar under filters */}
      <div className="mt-6 lg:hidden">
        <EventsCalendar
          events={categoryEvents}
          categorySlug={categorySlug}
          selectedDate={selectedDate}
        />
      </div>

      {/* Laptop+: schedule left, calendar right */}
      <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_22.5rem] xl:gap-10">
        <div className="min-w-0">
          <h2 className="font-display text-2xl leading-none sm:text-3xl">
            The Competition Schedule
            {selectedDate ? (
              <span className="mt-2 block font-sans text-sm font-normal tracking-normal text-muted normal-case">
                Showing {selectedDate}
              </span>
            ) : null}
          </h2>

          {filtered.length ? (
            <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
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
        </div>

        <aside className="hidden lg:block">
          <div className="lg:sticky lg:top-24">
            <EventsCalendar
              events={categoryEvents}
              categorySlug={categorySlug}
              selectedDate={selectedDate}
            />
          </div>
        </aside>
      </div>

      <MatchDetailsDrawer
        event={selectedEvent}
        open={Boolean(selectedEvent)}
        now={now}
        onClose={closeDetails}
      />
    </>
  );
}
