import type { FairEvent } from "@/lib/data/public";

export type EventStatusTone = "accent" | "muted" | "info";

export function pickFeaturedEvent(events: FairEvent[]): FairEvent | null {
  if (!events.length) return null;

  const byStart = (a: FairEvent, b: FairEvent) =>
    a.starts_at.localeCompare(b.starts_at);

  const live = events
    .filter((e) => e.status === "in_progress")
    .sort(byStart)[0];
  if (live) return live;

  const upcoming = events
    .filter((e) => e.status === "upcoming")
    .sort(byStart)[0];
  if (upcoming) return upcoming;

  return null;
}

export function eventStatusTone(status: string): EventStatusTone {
  if (status === "in_progress") return "accent";
  if (status === "final") return "info";
  return "muted";
}

export function eventStatusDisplay(status: string): string {
  if (status === "in_progress") return "IN PROGRESS";
  if (status === "final") return "FINAL";
  if (status === "upcoming") return "UPCOMING";
  return status.replaceAll("_", " ").toUpperCase();
}

export function eventPrimaryCta(status: string): {
  label: string;
  kind: "details" | "results";
} {
  if (status === "final") {
    return { label: "View results", kind: "results" };
  }
  return { label: "Match details", kind: "details" };
}

export function eventMatchupLabel(event: FairEvent): string | null {
  if (event.team_a && event.team_b) {
    return `${event.team_a.name} vs ${event.team_b.name}`;
  }
  return null;
}

export function eventSubtitle(event: FairEvent): string {
  return eventMatchupLabel(event) ?? (event.notes || "All teams");
}

export function eventFormat(event: FairEvent): string | null {
  if (!event.team_a || !event.team_b) return null;
  const notes = event.notes.trim();
  return notes || null;
}
