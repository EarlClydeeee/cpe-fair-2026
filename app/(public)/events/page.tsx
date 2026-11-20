import type { Metadata } from "next";
import Link from "next/link";
import { EventsLineup } from "@/components/events/events-lineup";
import { getCategories, getEvents } from "@/lib/data/public";
import { eventMvpTitle } from "@/lib/events";

export const metadata: Metadata = { title: "Events" };
export const instant = false;

type Props = { searchParams: Promise<{ category?: string; date?: string }> };

export default async function EventsPage({ searchParams }: Props) {
  const { category, date } = await searchParams;
  const [categories, events] = await Promise.all([getCategories(), getEvents()]);
  const mvpCount = events.filter((event) => Boolean(eventMvpTitle(event))).length;

  const selectedDate =
    date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="reveal flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] text-accent uppercase sm:text-xs">
            Six categories. Endless possibilities.
          </p>
          <h1 className="mt-2 font-display text-4xl leading-none sm:text-6xl">
            The Event Lineup
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            Find your next match, follow the action, and catch every result.
          </p>
        </div>
        <Link
          href="/mvp"
          className="inline-flex min-h-11 items-center rounded-lg border border-accent/40 bg-accent/10 px-4 text-sm font-semibold text-accent transition-colors duration-200 hover:bg-accent/20"
        >
          MVP list{mvpCount > 0 ? ` (${mvpCount})` : ""} →
        </Link>
      </div>

      <div className="dash-rule my-6 sm:my-8" />

      <EventsLineup
        categories={categories}
        events={events}
        categorySlug={category}
        selectedDate={selectedDate}
      />
    </div>
  );
}
