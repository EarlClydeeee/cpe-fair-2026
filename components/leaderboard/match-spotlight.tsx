import Link from "next/link";
import type { FairEvent } from "@/lib/data/public";
import { formatTime } from "@/lib/format";

/** Prefer in-progress, else soonest upcoming. Optionally prefer a category. */
export function pickSpotlight(
  events: FairEvent[],
  categorySlug?: string,
): FairEvent | null {
  if (!events.length) return null;

  const inCategory = (e: FairEvent) =>
    !categorySlug || e.categories?.slug === categorySlug;

  const byStart = (a: FairEvent, b: FairEvent) =>
    a.starts_at.localeCompare(b.starts_at);

  const scoped = events.filter(inCategory);
  const pool = scoped.length ? scoped : events;

  const live = pool
    .filter((e) => e.status === "in_progress")
    .sort(byStart)[0];
  if (live) return live;

  const upcoming = pool
    .filter((e) => e.status === "upcoming")
    .sort(byStart)[0];
  if (upcoming) return upcoming;

  return pool[0] ?? null;
}

export function MatchSpotlight({ event }: { event: FairEvent }) {
  const matchup =
    event.team_a && event.team_b
      ? `${event.team_a.name} vs ${event.team_b.name}`
      : null;

  return (
    <div className="rounded-xl bg-accent p-5 text-black">
      <p className="text-[10px] font-semibold tracking-[0.18em] uppercase">
        Match spotlight
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
