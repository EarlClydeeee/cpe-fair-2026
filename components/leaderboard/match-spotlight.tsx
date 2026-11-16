import Link from "next/link";
import type { FairEvent } from "@/lib/data/public";
import { pickFeaturedEvent } from "@/lib/events";
import { formatTime } from "@/lib/format";

/** Prefer in-progress, else soonest upcoming. Optionally prefer a category. */
export function pickSpotlight(
  events: FairEvent[],
  categorySlug?: string,
): FairEvent | null {
  if (!events.length) return null;
  if (!categorySlug) return pickFeaturedEvent(events);

  const scoped = events.filter((e) => e.categories?.slug === categorySlug);
  return pickFeaturedEvent(scoped.length ? scoped : events);
}

export function MatchSpotlight({ event }: { event: FairEvent }) {
  const live = event.status === "in_progress";
  const matchup =
    event.team_a && event.team_b
      ? `${event.team_a.name} vs ${event.team_b.name}`
      : null;

  return (
    <div className="rounded-xl bg-accent p-5 text-black">
      <p className="text-[10px] font-semibold tracking-[0.18em] uppercase">
        {live ? "Live now" : "Up next"}
        {event.categories?.name ? ` / ${event.categories.name}` : ""}
      </p>
      <h3 className="mt-3 font-display text-3xl leading-none">{event.title}</h3>
      {matchup ? <p className="mt-2 font-display text-xl">{matchup}</p> : null}
      <p className="mt-3 text-sm">
        {event.venue} · {formatTime(event.starts_at)}
      </p>
      <Link
        href={`/events/${event.id}`}
        className="mt-5 inline-flex rounded-lg bg-black px-4 py-2 text-sm text-white transition-opacity duration-200 hover:opacity-90"
      >
        View match details
      </Link>
    </div>
  );
}
