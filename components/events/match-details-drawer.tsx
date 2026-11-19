"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Badge } from "@/components/ui/badge";
import type { FairEvent } from "@/lib/data/public";
import {
  eventFormat,
  eventMatchupLabel,
  eventMvpTitle,
  eventPrimaryCta,
  eventStatusDisplay,
  eventStatusTone,
  eventWinnerLabel,
  getComputedEventStatus,
} from "@/lib/events";
import { formatDateTime, formatEventWindow } from "@/lib/format";

export function MatchDetailsDrawer({
  event,
  open,
  now = new Date(),
  onClose,
}: {
  event: FairEvent | null;
  open: boolean;
  now?: Date;
  onClose: () => void;
}) {
  const titleId = useId();
  const descId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !event || !mounted) return null;

  const status = getComputedEventStatus(event, now);
  const isFinal = status === "ended";
  const isOngoing = status === "ongoing";
  const format = eventFormat(event);
  const winner = eventWinnerLabel(event);
  const mvp = eventMvpTitle(event);
  const cta = eventPrimaryCta(status);
  const resultsHref = event.categories?.slug
    ? `/leaderboard?category=${event.categories.slug}`
    : "/leaderboard";

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md transition-opacity duration-200"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-border bg-[#141414] shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-6 py-4 bg-surface/80">
          <div className="flex flex-wrap items-center gap-2">
            {event.categories?.name ? (
              <Badge tone="accent">{event.categories.name}</Badge>
            ) : null}
            {event.is_highlighted ? <Badge tone="accent">Spotlight</Badge> : null}
            {isOngoing ? (
              <Badge tone="accent" className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
                Live
              </Badge>
            ) : (
              <Badge tone={eventStatusTone(status)}>
                {eventStatusDisplay(status)}
              </Badge>
            )}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-full p-2 text-muted transition-colors hover:bg-surface-2 hover:text-foreground cursor-pointer"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <h2
            id={titleId}
            className="font-display text-3xl sm:text-4xl leading-tight font-black tracking-wide text-foreground"
          >
            {event.name}
          </h2>

          <p id={descId} className="sr-only">
            {isFinal
              ? `Game result and match details for ${event.name}`
              : `Match details and schedule for ${event.name}`}
          </p>

          {/* RESULTS VIEW: For Ended / Final Games */}
          {isFinal ? (
            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-[0.16em] text-accent uppercase">
                  Match Result
                </span>
                <div className="h-px flex-1 bg-border/80" />
              </div>

              {/* Head-to-Head Result Cards */}
              {event.team_a && event.team_b ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Team A */}
                  <div
                    className={`relative rounded-xl border p-4 transition-colors ${
                      event.winner_team_id === event.team_a.id
                        ? "border-accent/60 bg-accent/10 shadow-md shadow-accent/5"
                        : "border-border bg-surface/60 opacity-80"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{
                            backgroundColor: event.team_a.color_hex || "#ff6b21",
                          }}
                        />
                        {event.team_a.slug ? (
                          <Link
                            href={`/teams/${event.team_a.slug}`}
                            className="font-display text-lg font-bold text-foreground hover:text-accent truncate transition-colors"
                          >
                            {event.team_a.name}
                          </Link>
                        ) : (
                          <span className="font-display text-lg font-bold text-foreground truncate">
                            {event.team_a.name}
                          </span>
                        )}
                      </div>
                      {event.winner_team_id === event.team_a.id ? (
                        <span className="inline-flex items-center gap-1 rounded bg-accent px-2 py-0.5 text-[10px] font-bold text-black uppercase">
                          🏆 Winner
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Team B */}
                  <div
                    className={`relative rounded-xl border p-4 transition-colors ${
                      event.winner_team_id === event.team_b.id
                        ? "border-accent/60 bg-accent/10 shadow-md shadow-accent/5"
                        : "border-border bg-surface/60 opacity-80"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{
                            backgroundColor: event.team_b.color_hex || "#3b82f6",
                          }}
                        />
                        {event.team_b.slug ? (
                          <Link
                            href={`/teams/${event.team_b.slug}`}
                            className="font-display text-lg font-bold text-foreground hover:text-accent truncate transition-colors"
                          >
                            {event.team_b.name}
                          </Link>
                        ) : (
                          <span className="font-display text-lg font-bold text-foreground truncate">
                            {event.team_b.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Winner Callout Box */}
              {event.winner_team ? (
                <div className="flex items-center gap-3.5 rounded-xl border border-accent/40 bg-accent/10 p-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold tracking-[0.18em] text-accent uppercase">
                      Official Winner
                    </p>
                    <p className="font-display text-xl sm:text-2xl font-bold text-foreground truncate">
                      {event.winner_team.name}
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Score / Result Notes */}
              {event.result_note ? (
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-[10px] font-bold tracking-[0.16em] text-muted uppercase">
                    Score / Match Summary
                  </p>
                  <p className="mt-1.5 text-base font-semibold text-foreground">
                    {event.result_note}
                  </p>
                </div>
              ) : null}

              {mvp ? (
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-[10px] font-bold tracking-[0.16em] text-muted uppercase">
                    MVP
                  </p>
                  <p className="mt-1.5 text-base font-semibold text-foreground">
                    {mvp}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            /* DETAILS VIEW: For Upcoming / Live Games */
            <div className="mt-5 space-y-4">
              {isOngoing ? (
                <div className="flex items-center gap-3 rounded-xl border border-accent/40 bg-accent/10 p-4">
                  <span className="relative flex h-3 w-3 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-accent" />
                  </span>
                  <div>
                    <p className="text-xs font-bold tracking-wider text-accent uppercase">
                      Match Currently In Progress
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      Spectators can watch live at {event.venue || "the venue"}.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Matchup Duel Preview */}
              {event.team_a && event.team_b ? (
                <div className="rounded-xl border border-border bg-surface/80 p-4">
                  <p className="text-[10px] font-bold tracking-[0.16em] text-muted uppercase">
                    Head to Head Matchup
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: event.team_a.color_hex || "#ff6b21",
                        }}
                      />
                      {event.team_a.slug ? (
                        <Link
                          href={`/teams/${event.team_a.slug}`}
                          className="font-display text-lg font-bold text-foreground hover:text-accent truncate transition-colors"
                        >
                          {event.team_a.name}
                        </Link>
                      ) : (
                        <span className="font-display text-lg font-bold text-foreground truncate">
                          {event.team_a.name}
                        </span>
                      )}
                    </div>
                    <span className="rounded-full bg-surface-2 border border-border px-2.5 py-1 text-xs font-bold text-muted">
                      VS
                    </span>
                    <div className="flex items-center gap-2.5 min-w-0 justify-end">
                      {event.team_b.slug ? (
                        <Link
                          href={`/teams/${event.team_b.slug}`}
                          className="font-display text-lg font-bold text-foreground hover:text-accent truncate transition-colors text-right"
                        >
                          {event.team_b.name}
                        </Link>
                      ) : (
                        <span className="font-display text-lg font-bold text-foreground truncate text-right">
                          {event.team_b.name}
                        </span>
                      )}
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: event.team_b.color_hex || "#3b82f6",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-surface/80 p-4">
                  <p className="text-[10px] font-bold tracking-[0.16em] text-muted uppercase">
                    Competitors
                  </p>
                  <p className="mt-1.5 font-display text-lg font-medium text-foreground">
                    {event.match_format || "All eight teams"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Event Metadata Breakdown Grid */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold tracking-[0.16em] text-muted uppercase">
                Event Details
              </span>
              <div className="h-px flex-1 bg-border/80" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* When */}
              <div className="rounded-xl border border-border bg-surface p-3.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-muted uppercase">
                  <svg
                    className="h-3.5 w-3.5 text-accent shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                    <line x1="16" x2="16" y1="2" y2="6" />
                    <line x1="8" x2="8" y1="2" y2="6" />
                    <line x1="3" x2="21" y1="10" y2="10" />
                  </svg>
                  <span>When</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatEventWindow(event.start_at, event.end_at)}
                </p>
              </div>

              {/* Venue */}
              <div className="rounded-xl border border-border bg-surface p-3.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-muted uppercase">
                  <svg
                    className="h-3.5 w-3.5 text-accent shrink-0"
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
                  <span>Venue</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {event.venue || "Venue TBA"}
                </p>
              </div>

              {/* Category */}
              <div className="rounded-xl border border-border bg-surface p-3.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-muted uppercase">
                  <svg
                    className="h-3.5 w-3.5 text-accent shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span>Category</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {event.categories?.name || "General"}
                </p>
              </div>

              {/* Format */}
              {format ? (
                <div className="rounded-xl border border-border bg-surface p-3.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-muted uppercase">
                    <svg
                      className="h-3.5 w-3.5 text-accent shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" x2="12" y1="8" y2="12" />
                      <line x1="12" x2="12.01" y1="16" y2="16" />
                    </svg>
                    <span>Format</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {format}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 border-t border-border px-6 py-4 bg-surface/60">
          {isFinal && event.categories?.slug ? (
            <Link
              href={resultsHref}
              className="w-full sm:w-auto inline-flex min-h-10 items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-bold text-black transition hover:bg-accent-dim"
            >
              View Standings
            </Link>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex min-h-10 items-center justify-center rounded-lg border border-border/80 px-5 py-2 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-foreground cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export { MatchDetailsDrawer as MatchDetailsModal };
