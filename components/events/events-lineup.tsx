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
  const now = useNow(30_000);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
        <HeroMatchBanner event={featured} now={now} onOpenDetails={openDetails} />
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
          {dayDates.map((_, index) => {
            const d = index + 1;
            return (
              <Link
                key={dayDates[index]}
                href={`/events?day=${d}${categorySlug ? `&category=${categorySlug}` : ""}`}
                className={`rounded-lg border px-3 py-2 uppercase transition-colors duration-200 ${
                  day === d
                    ? "border-accent text-accent"
                    : "border-border text-muted hover:text-foreground"
                }`}
              >
                {dayLabel(d)}
              </Link>
            );
          })}
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
              now={now}
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
        now={now}
        onClose={closeDetails}
      />
    </>
  );
}
