"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FairEvent } from "@/lib/data/public";
import {
  WEEKDAY_LABELS,
  buildMonthGrid,
  eventsByDateKey,
  fallbackCalendarMonth,
  monthsSpannedByEvents,
  parseDateKey,
  type CalendarMonth,
} from "@/lib/calendar";
import { manilaDateKey } from "@/lib/format";

function eventsHref(opts: { date?: string; categorySlug?: string }): string {
  const params = new URLSearchParams();
  if (opts.categorySlug) params.set("category", opts.categorySlug);
  if (opts.date) params.set("date", opts.date);
  const q = params.toString();
  return q ? `/events?${q}` : "/events";
}

function Chevron({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {dir === "prev" ? (
        <path d="M15 18l-6-6 6-6" />
      ) : (
        <path d="M9 18l6-6-6-6" />
      )}
    </svg>
  );
}

function monthIndex(months: CalendarMonth[], selectedDate?: string): number {
  if (selectedDate) {
    const parts = parseDateKey(selectedDate);
    if (parts) {
      const i = months.findIndex(
        (m) => m.year === parts.year && m.month === parts.month,
      );
      if (i >= 0) return i;
    }
  }
  return 0;
}

export function EventsCalendar({
  events,
  categorySlug,
  selectedDate,
  className = "",
}: {
  events: FairEvent[];
  categorySlug?: string;
  selectedDate?: string;
  className?: string;
}) {
  const months = useMemo(() => {
    const spanned = monthsSpannedByEvents(events);
    return spanned.length ? spanned : [fallbackCalendarMonth()];
  }, [events]);

  const [activeIndex, setActiveIndex] = useState(() =>
    monthIndex(months, selectedDate),
  );

  useEffect(() => {
    setActiveIndex(monthIndex(months, selectedDate));
  }, [months, selectedDate]);

  const safeIndex = Math.min(Math.max(activeIndex, 0), months.length - 1);
  const active = months[safeIndex] ?? months[0];
  const grid = useMemo(
    () => buildMonthGrid(active.year, active.month),
    [active.year, active.month],
  );
  const byDate = useMemo(() => eventsByDateKey(events), [events]);
  const todayKey = manilaDateKey(new Date().toISOString());

  return (
    <section
      aria-label="Events calendar"
      className={`overflow-hidden rounded-xl border border-border bg-surface ${className}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-3 sm:px-4">
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted transition-colors duration-200 hover:border-accent/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Previous month"
          disabled={safeIndex <= 0}
          onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
        >
          <Chevron dir="prev" />
        </button>
        <div className="min-w-0 text-center">
          <p className="text-[10px] tracking-[0.18em] text-accent uppercase">
            Calendar
          </p>
          <h3 className="mt-0.5 truncate font-display text-lg leading-none tracking-wide sm:text-xl">
            {active.label}
          </h3>
        </div>
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted transition-colors duration-200 hover:border-accent/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Next month"
          disabled={safeIndex >= months.length - 1}
          onClick={() =>
            setActiveIndex((i) => Math.min(months.length - 1, i + 1))
          }
        >
          <Chevron dir="next" />
        </button>
      </div>

      <div className="p-3 sm:p-4">
        <div className="mb-2 grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((label) => (
            <span
              key={label}
              className="py-1 text-center text-[10px] font-medium tracking-[0.14em] text-muted uppercase"
            >
              {label}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {grid.map((cell, i) => {
            if (!cell.dateKey || cell.day == null) {
              return <div key={`pad-${i}`} className="aspect-square" />;
            }

            const dayEvents = byDate.get(cell.dateKey) ?? [];
            const hasEvents = dayEvents.length > 0;
            const selected = selectedDate === cell.dateKey;
            const isToday = cell.dateKey === todayKey;

            const base =
              "relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors duration-200";

            if (!hasEvents) {
              return (
                <span
                  key={cell.dateKey}
                  className={`${base} text-muted/70 ${
                    isToday ? "ring-1 ring-border" : ""
                  }`}
                >
                  {cell.day}
                </span>
              );
            }

            return (
              <Link
                key={cell.dateKey}
                href={eventsHref({
                  date: selected ? undefined : cell.dateKey,
                  categorySlug,
                })}
                aria-label={`${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"} on ${cell.dateKey}`}
                aria-current={selected ? "date" : undefined}
                className={`${base} cursor-pointer ${
                  selected
                    ? "bg-accent font-semibold text-black"
                    : "border border-transparent bg-accent-soft text-foreground hover:border-accent/60 hover:bg-accent/20"
                } ${isToday && !selected ? "ring-1 ring-accent/50" : ""}`}
              >
                <span className="leading-none">{cell.day}</span>
                {!selected ? (
                  <span
                    aria-hidden
                    className="mt-0.5 h-1 w-1 rounded-full bg-accent"
                  />
                ) : null}
              </Link>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-accent" aria-hidden />
            Days with matches
          </span>
          {selectedDate ? (
            <Link
              href={eventsHref({ categorySlug })}
              className="tracking-wide text-accent uppercase transition-colors duration-200 hover:brightness-110"
            >
              Clear date
            </Link>
          ) : (
            <span>{byDate.size} active dates</span>
          )}
        </div>
      </div>
    </section>
  );
}
