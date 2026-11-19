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

/**
 * Status is admin-controlled (upcoming / ongoing / ended).
 * The only schedule rule: an Upcoming (or legacy Auto) event whose end
 * window has passed is treated as Ended so it cannot stay public forever.
 */
export function getComputedEventStatus(
  event: EventStatusInput,
  now: Date,
): ComputedEventStatus {
  if (event.status_override === "ended") return "ended";
  if (event.status_override === "ongoing") return "ongoing";

  const end = new Date(event.end_at).getTime();
  if (Number.isFinite(end) && now.getTime() >= end) return "ended";

  // upcoming + legacy auto both read as upcoming until the admin flips mode
  return "upcoming";
}

/** Persist overdue Upcoming/Auto as Ended when saving. */
export function resolveStatusOverrideForSave(
  statusOverride: EventStatusOverride,
  endAt: string,
  now: Date = new Date(),
): EventStatusOverride {
  if (statusOverride === "ongoing" || statusOverride === "ended") {
    return statusOverride;
  }
  const end = new Date(endAt).getTime();
  if (Number.isFinite(end) && now.getTime() >= end) return "ended";
  return statusOverride === "auto" ? "upcoming" : statusOverride;
}

export function pickFeaturedEvent(
  events: FairEvent[],
  now: Date,
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

/** Event Status Preview labels (mockup: FINAL not ENDED) */
export function eventPreviewStatusDisplay(
  status: ComputedEventStatus | string,
): string {
  if (status === "ongoing") return "ONGOING";
  if (status === "ended") return "FINAL";
  if (status === "upcoming") return "UPCOMING";
  return status.replaceAll("_", " ").toUpperCase();
}

export function eventPreviewStatusCopy(
  status: ComputedEventStatus,
): string {
  if (status === "upcoming") {
    return "Admin set Upcoming. After the scheduled end time, this becomes Final automatically.";
  }
  if (status === "ongoing") {
    return "Admin set Ongoing. Flip Status mode to Ended when the match is finished.";
  }
  return "Final — winner assignment is unlocked.";
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
  if (!event) return "";
  return (
    eventMatchupLabel(event) ??
    (typeof event.match_format === "string" && event.match_format.trim()
      ? event.match_format.trim()
      : "All eight teams")
  );
}

export function eventFormat(event: FairEvent): string | null {
  if (!event || typeof event.match_format !== "string") return null;
  const format = event.match_format.trim();
  return format || null;
}

export function eventWinnerLabel(event: FairEvent): string | null {
  // Only announce when admin has set Status mode to Ended.
  if (event.status_override !== "ended") return null;
  if (!event.winner_team) return null;
  return `Winner: ${event.winner_team.name}`;
}

export function eventMvpTitle(event: FairEvent): string | null {
  const title = event.mvp_title?.trim();
  return title ? title : null;
}
