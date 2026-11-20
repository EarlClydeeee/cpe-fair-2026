"use client";

import { Badge } from "@/components/ui/badge";
import type { FairEvent } from "@/lib/data/public";
import {
  eventFinalScore,
  eventFormat,
  eventMatchupLabel,
  eventMvpTitle,
  eventStatusDisplay,
  eventStatusTone,
  eventWinnerLabel,
  getComputedEventStatus,
} from "@/lib/events";
import { formatDate, formatTime } from "@/lib/format";

export function HeroMatchBanner({
  event,
  now = new Date(),
  onOpenDetails,
}: {
  event: FairEvent;
  now?: Date;
  onOpenDetails: (event: FairEvent) => void;
}) {
  const status = getComputedEventStatus(event, now);
  const live = status === "ongoing";
  const matchup = eventMatchupLabel(event);
  const format = eventFormat(event);
  const winner = eventWinnerLabel(event);
  const finalScore = eventFinalScore(event);
  const mvp = eventMvpTitle(event);
  const hasTeams = Boolean(event.team_a || event.team_b);

  return (
    <div className="grid overflow-hidden rounded-xl border border-border lg:grid-cols-[1.5fr_0.7fr]">
      <div className="bg-accent px-4 py-5 text-black sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase">
            {event.is_highlighted
              ? "Spotlight"
              : live
                ? "Live now"
                : status === "ended"
                  ? "Final"
                  : "Up next"}
            {event.categories?.name ? ` / ${event.categories.name}` : ""}
          </p>
          <Badge
            tone={eventStatusTone(status)}
            className="bg-black/15 text-black"
          >
            {eventStatusDisplay(status)}
          </Badge>
        </div>

        <h2 className="mt-3 font-display text-[2rem] leading-[0.95] tracking-wide sm:text-5xl">
          {event.name}
        </h2>

        {hasTeams ? (
          <div className="mt-4 grid gap-1 sm:hidden">
            <p className="font-display text-lg leading-tight tracking-wide">
              {event.team_a?.name ?? "TBD"}
            </p>
            <p className="text-[10px] font-bold tracking-[0.2em] text-black/55 uppercase">
              versus
            </p>
            <p className="font-display text-lg leading-tight tracking-wide">
              {event.team_b?.name ?? "TBD"}
            </p>
          </div>
        ) : matchup ? (
          <p className="mt-3 font-display text-xl sm:hidden">{matchup}</p>
        ) : null}

        {matchup ? (
          <p className="mt-3 hidden font-display text-2xl sm:block">{matchup}</p>
        ) : null}

        {winner ? <p className="mt-2 text-sm font-medium">{winner}</p> : null}
        {finalScore ? (
          <p className="mt-1 font-mono text-sm font-semibold text-black/90">
            <span className="font-sans text-xs uppercase tracking-wider text-black/60 font-bold mr-1.5">Score:</span>
            {finalScore}
          </p>
        ) : null}
        {mvp ? (
          <p className="mt-1 text-sm text-black/80">
            <span className="font-semibold uppercase tracking-wide">MVP</span>
            {" · "}
            {mvp}
          </p>
        ) : null}

        <p className="mt-4 text-sm text-black/80">
          {event.venue || "Venue TBA"}
          {format ? ` · ${format}` : ""}
        </p>

        <div className="mt-5 flex items-end justify-between gap-3">
          <button
            type="button"
            onClick={() => onOpenDetails(event)}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-black px-4 py-2.5 text-sm text-white transition-opacity duration-200 hover:opacity-90"
          >
            {status === "ended" ? "View match results" : "View match details"}
          </button>
          <p className="max-w-[9.5rem] text-right text-[10px] leading-snug tracking-[0.12em] text-black/65 uppercase lg:hidden">
            {formatDate(event.start_at)}
            <span className="mt-0.5 block tracking-[0.16em]">
              {formatTime(event.start_at)}
            </span>
          </p>
        </div>
      </div>

      <div className="hidden place-items-center bg-surface p-8 lg:grid">
        <div className="text-center">
          <p className="text-xs tracking-[0.18em] text-muted uppercase">
            {formatDate(event.start_at)}
          </p>
          <p className="mt-2 font-display text-3xl text-foreground">
            {formatTime(event.start_at)}
          </p>
        </div>
      </div>
    </div>
  );
}
