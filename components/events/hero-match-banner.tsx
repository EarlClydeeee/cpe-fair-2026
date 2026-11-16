"use client";

import { Badge } from "@/components/ui/badge";
import type { FairEvent } from "@/lib/data/public";
import {
  eventFormat,
  eventMatchupLabel,
  eventStatusDisplay,
  eventStatusTone,
} from "@/lib/events";
import { dayLabel, formatTime } from "@/lib/format";

export function HeroMatchBanner({
  event,
  onOpenDetails,
}: {
  event: FairEvent;
  onOpenDetails: (event: FairEvent) => void;
}) {
  const live = event.status === "in_progress";
  const matchup = eventMatchupLabel(event);
  const format = eventFormat(event);

  return (
    <div className="grid overflow-hidden rounded-xl border border-border lg:grid-cols-[1.5fr_0.7fr]">
      <div className="bg-accent p-6 text-black sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase">
            {live ? "Live now" : "Up next"}
            {event.categories?.name ? ` / ${event.categories.name}` : ""}
          </p>
          <Badge
            tone={eventStatusTone(event.status)}
            className="bg-black/15 text-black"
          >
            {eventStatusDisplay(event.status)}
          </Badge>
        </div>
        <h2 className="mt-3 font-display text-4xl leading-none sm:text-5xl">
          {event.title}
        </h2>
        {matchup ? (
          <p className="mt-3 font-display text-2xl">{matchup}</p>
        ) : null}
        <p className="mt-4 text-sm text-black/80">
          {event.venue || "Venue TBA"}
          {format ? ` · ${format}` : ""}
        </p>
        <button
          type="button"
          onClick={() => onOpenDetails(event)}
          className="mt-6 inline-flex cursor-pointer rounded-lg bg-black px-4 py-2 text-sm text-white transition-opacity duration-200 hover:opacity-90"
        >
          View match details
        </button>
      </div>
      <div className="grid place-items-center bg-surface p-8">
        <div className="text-center">
          <p className="text-xs tracking-[0.18em] text-muted uppercase">
            {dayLabel(event.day_number)}
          </p>
          <p className="mt-2 font-display text-6xl">{formatTime(event.starts_at)}</p>
        </div>
      </div>
    </div>
  );
}
