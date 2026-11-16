import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getCategories, getEvents } from "@/lib/data/public";
import { dayLabel, eventStatusLabel, formatTime } from "@/lib/format";

export const metadata: Metadata = { title: "Events" };

type Props = { searchParams: Promise<{ category?: string; day?: string }> };

export default async function EventsPage({ searchParams }: Props) {
  const { category, day } = await searchParams;
  const dayNum = day ? Number(day) : undefined;
  const [categories, events] = await Promise.all([
    getCategories(),
    getEvents({ categorySlug: category, day: Number.isFinite(dayNum) ? dayNum : undefined }),
  ]);
  const featured = events.find((e) => e.status === "upcoming") ?? events[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-5xl sm:text-6xl">The Event Lineup</h1>
          <p className="mt-3 max-w-xl text-sm text-muted">
            Find your next match, follow the action, and catch every result.
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-6xl text-accent">2026</p>
          <p className="text-xs tracking-[0.18em] text-muted uppercase">The next chapter</p>
        </div>
      </div>

      {featured ? (
        <div className="mt-10 grid gap-0 overflow-hidden rounded-2xl border border-border lg:grid-cols-[1.4fr_0.8fr]">
          <div className="bg-accent p-6 text-black sm:p-8">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase">
              Up next / {featured.categories?.name ?? "Event"}
            </p>
            <h2 className="mt-3 font-display text-4xl leading-none sm:text-5xl">
              {featured.title}
              {featured.team_a && featured.team_b
                ? `: ${featured.team_a.name} vs ${featured.team_b.name}`
                : ""}
            </h2>
            <p className="mt-4 text-sm">
              {featured.venue}
              {featured.notes ? ` · ${featured.notes}` : ""}
            </p>
            <Link
              href={`/events/${featured.id}`}
              className="mt-6 inline-flex rounded-lg bg-black px-4 py-2 text-sm text-white"
            >
              View match details
            </Link>
          </div>
          <div className="grid place-items-center bg-surface p-8">
            <div className="text-center">
              <p className="font-display text-6xl">{formatTime(featured.starts_at)}</p>
              <p className="mt-2 text-xs tracking-[0.18em] text-muted uppercase">
                {dayLabel(featured.day_number)} schedule preview
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/events"
            className={`rounded-full px-4 py-2 text-xs uppercase ${
              !category ? "bg-accent text-black" : "bg-surface-2 text-muted"
            }`}
          >
            All events
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/events?category=${cat.slug}${day ? `&day=${day}` : ""}`}
              className={`rounded-full px-4 py-2 text-xs uppercase ${
                category === cat.slug ? "bg-accent text-black" : "bg-surface-2 text-muted"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
        <div className="flex gap-2 text-xs">
          {[1, 2].map((d) => (
            <Link
              key={d}
              href={`/events?day=${d}${category ? `&category=${category}` : ""}`}
              className={`rounded-lg border px-3 py-2 uppercase ${
                dayNum === d ? "border-accent text-accent" : "border-border text-muted"
              }`}
            >
              Day {String(d).padStart(2, "0")}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event, i) => (
          <article key={event.id} className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5">
            <span className="pointer-events-none absolute right-3 top-2 font-display text-6xl text-white/5">
              {String(i + 1).padStart(2, "0")}
            </span>
            <Badge
              tone={
                event.status === "in_progress"
                  ? "accent"
                  : event.status === "final"
                    ? "info"
                    : "muted"
              }
            >
              {eventStatusLabel(event.status)}
            </Badge>
            <p className="mt-3 text-xs tracking-wide text-muted uppercase">
              {event.categories?.name}
            </p>
            <h3 className="mt-1 font-display text-3xl">{event.title}</h3>
            <p className="mt-2 text-sm text-muted">
              {event.team_a && event.team_b
                ? `${event.team_a.name} vs ${event.team_b.name}`
                : event.notes || "All teams"}
            </p>
            <p className="mt-4 text-xs text-muted">
              {dayLabel(event.day_number)} · {formatTime(event.starts_at)} · {event.venue}
            </p>
            <Link href={`/events/${event.id}`} className="mt-4 inline-block text-sm text-accent">
              Match details →
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
