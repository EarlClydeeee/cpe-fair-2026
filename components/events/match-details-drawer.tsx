"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import type { FairEvent } from "@/lib/data/public";
import {
  eventFormat,
  eventMatchupLabel,
  eventPrimaryCta,
  eventStatusDisplay,
  eventStatusTone,
  eventWinnerLabel,
  getComputedEventStatus,
} from "@/lib/events";
import { formatEventWindow } from "@/lib/format";

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
  const closeRef = useRef<HTMLButtonElement>(null);

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

  if (!open || !event) return null;

  const status = getComputedEventStatus(event, now);
  const matchup = eventMatchupLabel(event);
  const format = eventFormat(event);
  const winner = eventWinnerLabel(event);
  const cta = eventPrimaryCta(status);
  const resultsHref = event.categories?.slug
    ? `/leaderboard?category=${event.categories.slug}`
    : "/leaderboard";

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <button
        type="button"
        aria-label="Close match details"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-muted uppercase">
            Match details
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-foreground"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          <div className="flex flex-wrap gap-2">
            {event.categories?.name ? (
              <Badge tone="accent">{event.categories.name}</Badge>
            ) : null}
            {event.is_highlighted ? <Badge tone="accent">Spotlight</Badge> : null}
            <Badge tone={eventStatusTone(status)}>
              {eventStatusDisplay(status)}
            </Badge>
          </div>

          <h2 id={titleId} className="mt-4 font-display text-4xl leading-none">
            {event.name}
          </h2>

          {matchup ? (
            <p className="mt-4 text-lg">
              {event.team_a ? (
                <Link
                  href={`/teams/${event.team_a.slug}`}
                  className="text-foreground transition-colors duration-200 hover:text-accent"
                >
                  {event.team_a.name}
                </Link>
              ) : null}
              <span className="text-muted"> vs </span>
              {event.team_b ? (
                <Link
                  href={`/teams/${event.team_b.slug}`}
                  className="text-foreground transition-colors duration-200 hover:text-accent"
                >
                  {event.team_b.name}
                </Link>
              ) : null}
            </p>
          ) : (
            <p className="mt-4 text-muted">
              {event.match_format || "All eight teams"}
            </p>
          )}

          {winner ? <p className="mt-3 text-sm text-info">{winner}</p> : null}
          {event.result_note ? (
            <p className="mt-1 text-sm text-muted">{event.result_note}</p>
          ) : null}

          <dl className="mt-8 grid gap-3">
            <div className="rounded-xl border border-border bg-background p-4">
              <dt className="text-[10px] tracking-wide text-muted uppercase">When</dt>
              <dd className="mt-1 font-medium">
                {formatEventWindow(event.start_at, event.end_at)}
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <dt className="text-[10px] tracking-wide text-muted uppercase">Venue</dt>
              <dd className="mt-1 font-medium">{event.venue || "TBA"}</dd>
            </div>
            {format ? (
              <div className="rounded-xl border border-border bg-background p-4">
                <dt className="text-[10px] tracking-wide text-muted uppercase">
                  Format
                </dt>
                <dd className="mt-1 font-medium">{format}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="flex flex-col gap-2 border-t border-border px-5 py-4">
          {cta.kind === "results" ? (
            <Link
              href={resultsHref}
              className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black transition-opacity duration-200 hover:opacity-90"
            >
              View results
            </Link>
          ) : null}
          <Link
            href={`/events/${event.id}`}
            className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm transition-colors duration-200 ${
              cta.kind === "results"
                ? "border border-border text-muted hover:text-foreground"
                : "bg-accent font-semibold text-black hover:opacity-90"
            }`}
          >
            Open full page
          </Link>
        </div>
      </aside>
    </div>
  );
}
