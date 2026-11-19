import type { Metadata } from "next";
import Link from "next/link";
import { getEvents } from "@/lib/data/public";
import { eventMatchupLabel, eventMvpTitle } from "@/lib/events";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "MVP list" };
export const instant = false;

export default async function MvpPage() {
  const events = await getEvents();
  const mvps = events
    .map((event) => {
      const title = eventMvpTitle(event);
      if (!title) return null;
      return { event, title };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => {
      const compA = a.event.competitions?.name ?? "";
      const compB = b.event.competitions?.name ?? "";
      if (compA !== compB) return compA.localeCompare(compB);
      return b.event.end_at.localeCompare(a.event.end_at);
    });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="reveal flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] text-accent uppercase sm:text-xs">
            Standout performers
          </p>
          <h1 className="mt-2 font-display text-4xl leading-none sm:text-6xl">
            MVP List
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            Every announced MVP across the fair, with their competition.
          </p>
        </div>
        <Link
          href="/events"
          className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface-2 px-4 text-sm text-muted transition-colors duration-200 hover:text-foreground"
        >
          ← Back to events
        </Link>
      </div>

      <div className="dash-rule my-6 sm:my-8" />

      <div className="flex flex-wrap items-baseline gap-6 border-b border-border/60 pb-4">
        <div>
          <p className="font-display text-2xl text-accent sm:text-4xl">
            {String(mvps.length).padStart(2, "0")}
          </p>
          <p className="text-[10px] tracking-[0.18em] text-muted uppercase">
            MVPs announced
          </p>
        </div>
      </div>

      {mvps.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          No MVPs have been announced yet. Check back after finished matches are
          updated.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-border/60 border border-border bg-surface sm:mt-8">
          {mvps.map(({ event, title }, index) => {
            const matchup = eventMatchupLabel(event);
            const competition = event.competitions?.name ?? "Competition TBA";
            const category = event.categories?.name;

            return (
              <li key={event.id}>
                <Link
                  href={`/events/${event.id}`}
                  className="grid gap-3 px-4 py-4 transition-colors duration-200 hover:bg-surface-2 sm:grid-cols-[2.2fr_1.4fr_1fr] sm:items-center sm:gap-4 sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] tracking-[0.16em] text-muted uppercase">
                      #{String(index + 1).padStart(2, "0")}
                      {category ? ` · ${category}` : ""}
                    </p>
                    <p className="mt-1 font-display text-xl leading-tight sm:text-2xl">
                      {title}
                    </p>
                    <p className="mt-1 truncate text-sm text-muted">
                      {event.name}
                      {matchup ? ` · ${matchup}` : ""}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] tracking-[0.16em] text-muted uppercase">
                      Competition
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-foreground">
                      {competition}
                    </p>
                  </div>
                  <div className="min-w-0 sm:text-right">
                    <p className="text-[10px] tracking-[0.16em] text-muted uppercase">
                      Match date
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {formatDate(event.end_at || event.start_at)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
