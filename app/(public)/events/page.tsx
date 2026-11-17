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
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="reveal">
          <p className="text-xs tracking-[0.2em] text-accent uppercase">
            Six categories. Endless possibilities.
          </p>
          <h1 className="mt-2 font-display text-5xl sm:text-6xl">The Event Lineup</h1>
          <p className="mt-3 max-w-xl text-sm text-muted">
            Find your next match, follow the action, and catch every result.
          </p>
        </div>
      </div>

      <div className="dash-rule my-8" />

      <EventsLineup
        categories={categories}
        events={events}
        categorySlug={category}
        day={Number.isFinite(dayNum) ? dayNum : undefined}
      />
    </div>
  );
}
