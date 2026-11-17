import type { FairEvent } from "@/lib/data/public";
import type { Enums } from "@/lib/supabase/database.types";

export type EventStatusOverride = Enums<"event_status_override">;
export type ComputedEventStatus = "upcoming" | "ongoing" | "ended";
export type EventStatusTone = "accent" | "muted" | "info";

export type EventStatusInput = {
  start_at: string;
  end_at: string;
  status_override: EventStatusOverride;
  is_archived?: boolean;
  is_highlighted?: boolean;
};

export function getComputedEventStatus(
  event: EventStatusInput,
  now = new Date(),
): ComputedEventStatus {
  if (event.status_override !== "auto") {
    return event.status_override;
  }

  const start = new Date(event.start_at).getTime();
  const end = new Date(event.end_at).getTime();
  const t = now.getTime();

  if (t < start) return "upcoming";
  if (t >= start && t < end) return "ongoing";
  return "ended";
}

export function pickFeaturedEvent(
  events: FairEvent[],
  now = new Date(),
): FairEvent | null {
  const active = events.filter((e) => !e.is_archived);
  if (!active.length) return null;

  const byStart = (a: FairEvent, b: FairEvent) =>
    a.start_at.localeCompare(b.start_at);

  const highlighted = active.find((e) => e.is_highlighted);
  if (highlighted) return highlighted;

  const live = active
    .filter((e) => getComputedEventStatus(e, now) === "ongoing")
    .sort(byStart)[0];
  if (live) return live;

  const upcoming = active
    .filter((e) => getComputedEventStatus(e, now) === "upcoming")
    .sort(byStart)[0];
  if (upcoming) return upcoming;

  return null;
}

export function eventStatusTone(
  status: ComputedEventStatus | string,
): EventStatusTone {
  if (status === "ongoing" || status === "in_progress") return "accent";
  if (status === "ended" || status === "final") return "info";
  return "muted";
}

/** Public lineup / hero labels */
export function eventStatusDisplay(
  status: ComputedEventStatus | string,
): string {
  if (status === "ongoing" || status === "in_progress") return "IN PROGRESS";
  if (status === "ended" || status === "final") return "FINAL";
  if (status === "upcoming") return "UPCOMING";
  return status.replaceAll("_", " ").toUpperCase();
}

/** Admin directory labels */
export function eventAdminStatusDisplay(
  status: ComputedEventStatus | string,
): string {
  if (status === "ongoing") return "ONGOING";
  if (status === "ended") return "ENDED";
  if (status === "upcoming") return "UPCOMING";
  return status.replaceAll("_", " ").toUpperCase();
}

export function eventPrimaryCta(status: ComputedEventStatus | string): {
  label: string;
  kind: "details" | "results";
} {
  if (status === "ended" || status === "final") {
    return { label: "View results", kind: "results" };
  }
  return { label: "Match details", kind: "details" };
}

export function eventMatchupLabel(event: FairEvent): string | null {
  if (event.match_type === "all_teams") return null;
  if (event.team_a && event.team_b) {
    return `${event.team_a.name} vs ${event.team_b.name}`;
  }
  return null;
}

export function eventSubtitle(event: FairEvent): string {
  return eventMatchupLabel(event) ?? (event.match_format || "All eight teams");
}

export function eventFormat(event: FairEvent): string | null {
  const format = event.match_format.trim();
  return format || null;
}

export function eventWinnerLabel(event: FairEvent): string | null {
  if (!event.winner_team) return null;
  return `Winner: ${event.winner_team.name}`;
}
