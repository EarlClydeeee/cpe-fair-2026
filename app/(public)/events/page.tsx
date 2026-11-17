import type { Metadata } from "next";
import { EventsLineup } from "@/components/events/events-lineup";
import { getCategories, getEvents } from "@/lib/data/public";

export const metadata: Metadata = { title: "Events" };
export const instant = false;

type Props = { searchParams: Promise<{ category?: string; day?: string }> };

export default async function EventsPage({ searchParams }: Props) {
  const { category, day } = await searchParams;
  const dayNum = day ? Number(day) : undefined;
  const [categories, events] = await Promise.all([getCategories(), getEvents()]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="reveal">
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

      <div className="dash-rule my-6 sm:my-8" />

      <EventsLineup
        categories={categories}
        events={events}
        categorySlug={category}
        day={Number.isFinite(dayNum) ? dayNum : undefined}
      />
    </div>
  );
}
