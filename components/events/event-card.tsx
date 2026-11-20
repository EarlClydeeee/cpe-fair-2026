"use client";

import { Badge } from "@/components/ui/badge";
import type { FairEvent } from "@/lib/data/public";
import {
  eventFinalScore,
  eventMvpTitle,
  eventPrimaryCta,
  eventStatusDisplay,
  eventStatusTone,
  eventSubtitle,
  eventWinnerLabel,
  getComputedEventStatus,
} from "@/lib/events";
import { formatDate, formatTime } from "@/lib/format";

export function EventCard({
  event,
  index,
  now = new Date(),
  onOpenDetails,
}: {
  event: FairEvent;
  index: number;
  now?: Date;
  onOpenDetails: (event: FairEvent) => void;
}) {
  const status = getComputedEventStatus(event, now);
  const cta = eventPrimaryCta(status);
  const winner = eventWinnerLabel(event);
  const finalScore = eventFinalScore(event);
  const mvp = eventMvpTitle(event);
  const isFinal = status === "ended";
  const isOngoing = status === "ongoing";

  return (
    <article
      onClick={() => onOpenDetails(event)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDetails(event);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View ${isFinal ? "results" : "details"} for ${event.name}`}
      className="group relative flex cursor-pointer select-none overflow-hidden rounded-xl border border-border bg-surface transition-all duration-200 hover:border-accent/50 hover:bg-surface-2/60 hover:shadow-lg hover:shadow-accent/5 focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.99]"
    >
      {/* Decorative Index watermark placed safely in the upper-right background so it doesn't clash with CTA buttons */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-2 font-display text-5xl sm:text-6xl font-black text-white/[0.03] select-none transition-opacity group-hover:text-white/[0.06]"
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Left Date / Time Column */}
      <div className="hidden w-20 sm:w-24 shrink-0 flex-col items-center justify-center border-r border-border bg-background/50 px-2 py-4 text-center sm:flex">
        <span className="font-display text-sm sm:text-base font-bold text-foreground">
          {formatTime(event.start_at)}
        </span>
        <span className="mt-1 text-[10px] tracking-wider text-muted font-medium uppercase">
          {formatDate(event.start_at)}
        </span>
        {isOngoing ? (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold text-accent uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
            Live
          </span>
        ) : null}
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          {/* Header row: Category & Badges */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[0.16em] text-accent uppercase">
                {event.categories?.name}
              </p>
              <p className="mt-1 text-[10px] tracking-[0.12em] text-muted uppercase sm:hidden">
                {formatDate(event.start_at)} · {formatTime(event.start_at)}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
              {event.is_highlighted ? <Badge tone="accent">Spotlight</Badge> : null}
              {isOngoing ? (
                <Badge tone="accent" className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  Live
                </Badge>
              ) : (
                <Badge tone={eventStatusTone(status)}>
                  {eventStatusDisplay(status)}
                </Badge>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="mt-2.5 font-display text-2xl font-bold leading-tight tracking-wide text-foreground transition-colors group-hover:text-accent sm:text-3xl">
            {event.name}
          </h3>

          {/* Matchup / Teams with Color Indicators */}
          {event.team_a && event.team_b ? (
            <div className="mt-2 flex items-center flex-wrap gap-2 text-xs sm:text-sm">
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: event.team_a.color_hex || "#ff6b21" }}
                />
                <span className="truncate max-w-[120px] sm:max-w-[160px]">
                  {event.team_a.name}
                </span>
              </span>
              <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-muted uppercase">
                VS
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: event.team_b.color_hex || "#3b82f6" }}
                />
                <span className="truncate max-w-[120px] sm:max-w-[160px]">
                  {event.team_b.name}
                </span>
              </span>
            </div>
          ) : (
            <p className="mt-2 text-xs sm:text-sm text-muted">
              {eventSubtitle(event)}
            </p>
          )}

          {/* Winner and/or Final score banner for completed matches */}
          {(winner && event.winner_team) || finalScore ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-accent/10 border border-accent/25 px-3 py-2 text-xs">
              {winner && event.winner_team ? (
                <div className="flex items-center gap-1.5 font-bold text-foreground min-w-0">
                  <span className="truncate">Winner: {event.winner_team.name}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 font-semibold text-accent min-w-0 text-xs">
                  <span>Match Result</span>
                </div>
              )}
              {finalScore ? (
                <div className="inline-flex items-center gap-1.5 rounded-md bg-background/90 px-2.5 py-1 font-mono text-xs font-bold text-accent border border-accent/30 shadow-xs">
                  <span className="text-[9px] uppercase tracking-wider text-muted font-sans font-medium">
                    Score
                  </span>
                  <span>{finalScore}</span>
                </div>
              ) : null}
            </div>
          ) : null}
          {mvp ? (
            <p className="mt-2 text-[11px] tracking-wide text-muted">
              <span className="font-semibold text-foreground/80 uppercase">
                MVP
              </span>
              <span className="mx-1.5 text-border">·</span>
              <span className="text-foreground">{mvp}</span>
            </p>
          ) : null}
        </div>

        {/* Footer: Venue and Action Button */}
        <div className="mt-4 flex items-end justify-between gap-3 border-t border-border/50 pt-3">
          <div className="flex items-center gap-1.5 min-w-0 text-xs text-muted">
            <svg
              className="h-3.5 w-3.5 shrink-0 text-muted/70"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="truncate">{event.venue || "Venue TBA"}</span>
          </div>

          <span className="relative z-10 shrink-0 inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-accent transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-white">
            {cta.kind === "results" ? "Results →" : "Details →"}
          </span>
        </div>
      </div>
    </article>
  );
}
