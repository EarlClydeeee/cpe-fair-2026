import Link from "next/link";
import type { FairEvent } from "@/lib/data/public";
import {
  WEEKDAY_LABELS,
  buildMonthGrid,
  eventsByDateKey,
  fallbackCalendarMonth,
  monthsSpannedByEvents,
} from "@/lib/calendar";

function eventsHref(opts: {
  date?: string;
  categorySlug?: string;
}): string {
  const params = new URLSearchParams();
  if (opts.categorySlug) params.set("category", opts.categorySlug);
  if (opts.date) params.set("date", opts.date);
  const q = params.toString();
  return q ? `/events?${q}` : "/events";
}

export function EventsCalendar({
  events,
  selectedDate,
  categorySlug,
}: {
  events: FairEvent[];
  selectedDate?: string;
  categorySlug?: string;
}) {
  const byDate = eventsByDateKey(events);
  const months = monthsSpannedByEvents(events);
  const displayMonths = months.length ? months : [fallbackCalendarMonth()];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl leading-none sm:text-3xl">
            Event calendar
          </h2>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Months and weekdays follow the real calendar. Tap a date to filter
            the schedule.
          </p>
        </div>
        <Link
          href={eventsHref({ categorySlug })}
          className={`rounded-lg border px-3 py-2 text-[11px] tracking-[0.12em] uppercase transition-colors duration-200 sm:text-xs ${
            !selectedDate
              ? "border-accent text-accent"
              : "border-border text-muted hover:text-foreground"
          }`}
        >
          All dates
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {displayMonths.map((month) => {
          const cells = buildMonthGrid(month.year, month.month);
          return (
            <section
              key={`${month.year}-${month.month}`}
              className="overflow-hidden rounded-2xl border border-border bg-surface"
            >
              <header className="border-b border-border px-4 py-3">
                <h3 className="font-display text-lg tracking-wide uppercase sm:text-xl">
                  {month.label}
                </h3>
              </header>

              <div className="grid grid-cols-7 gap-px bg-border/40 p-px">
                {WEEKDAY_LABELS.map((label) => (
                  <div
                    key={label}
                    className="bg-surface-2 px-1 py-2 text-center text-[10px] font-semibold tracking-[0.14em] text-muted uppercase"
                  >
                    {label}
                  </div>
                ))}

                {cells.map((cell, index) => {
                  if (!cell.dateKey || cell.day === null) {
                    return (
                      <div
                        key={`pad-${month.year}-${month.month}-${index}`}
                        className="min-h-14 bg-surface sm:min-h-16"
                        aria-hidden
                      />
                    );
                  }

                  const dayEvents = byDate.get(cell.dateKey) ?? [];
                  const count = dayEvents.length;
                  const selected = selectedDate === cell.dateKey;
                  const hasEvents = count > 0;

                  return (
                    <Link
                      key={cell.dateKey}
                      href={eventsHref({
                        date: cell.dateKey,
                        categorySlug,
                      })}
                      aria-label={
                        hasEvents
                          ? `${cell.dateKey}, ${count} event${count === 1 ? "" : "s"}`
                          : cell.dateKey
                      }
                      aria-current={selected ? "date" : undefined}
                      className={`relative flex min-h-14 flex-col items-start gap-1 px-1.5 py-1.5 transition-colors duration-200 sm:min-h-16 sm:px-2 sm:py-2 ${
                        selected
                          ? "bg-accent/15 ring-1 ring-inset ring-accent/50"
                          : hasEvents
                            ? "bg-surface hover:bg-accent-soft"
                            : "bg-surface text-muted hover:bg-surface-2"
                      }`}
                    >
                      <span
                        className={`text-xs font-semibold sm:text-sm ${
                          selected
                            ? "text-accent"
                            : hasEvents
                              ? "text-foreground"
                              : "text-muted"
                        }`}
                      >
                        {cell.day}
                      </span>
                      {hasEvents ? (
                        <span className="flex max-w-full flex-col gap-0.5">
                          <span className="h-1 w-1 rounded-full bg-accent sm:hidden" />
                          <span className="hidden truncate text-[10px] leading-tight text-accent sm:block">
                            {count} event{count === 1 ? "" : "s"}
                          </span>
                          <span className="hidden truncate text-[10px] leading-tight text-muted sm:block">
                            {dayEvents[0]?.name}
                            {count > 1 ? ` +${count - 1}` : ""}
                          </span>
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
