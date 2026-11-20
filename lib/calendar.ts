import type { FairEvent } from "@/lib/data/public";
import { manilaDateKey } from "@/lib/format";

export type CalendarCell = {
  /** YYYY-MM-DD when this cell is a real day in the month; null for padding. */
  dateKey: string | null;
  day: number | null;
};

export type CalendarMonth = {
  year: number;
  /** 1–12 */
  month: number;
  label: string;
};

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Days in month (1–12). Leap-year safe via UTC date math. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Weekday of the 1st (0 = Sunday … 6 = Saturday).
 * Uses noon UTC on the 1st so the civil Manila calendar day is unambiguous
 * for typical fair dates (Manila is UTC+8).
 */
export function weekdayOfMonthStart(year: number, month: number): number {
  return new Date(Date.UTC(year, month - 1, 1, 12, 0, 0)).getUTCDay();
}

export function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function monthLabel(year: number, month: number): string {
  return `${MONTH_LABELS[month - 1]} ${year}`;
}

/** Sunday-first grid with leading/trailing null padding so length is a multiple of 7. */
export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const total = daysInMonth(year, month);
  const startWeekday = weekdayOfMonthStart(year, month);
  const cells: CalendarCell[] = [];

  for (let i = 0; i < startWeekday; i += 1) {
    cells.push({ dateKey: null, day: null });
  }
  for (let day = 1; day <= total; day += 1) {
    cells.push({ dateKey: dateKey(year, month, day), day });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ dateKey: null, day: null });
  }
  return cells;
}

export function parseDateKey(
  key: string,
): { year: number; month: number; day: number } | null {
  if (!DATE_KEY_RE.test(key)) return null;
  const [year, month, day] = key.split("-").map(Number);
  return { year, month, day };
}

export function isValidDateKey(
  value: string | undefined | null,
): value is string {
  if (!value || !DATE_KEY_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1) return false;
  return d <= daysInMonth(y, m);
}

/** Distinct Manila months that contain at least one event, sorted ascending. */
export function monthsSpannedByEvents(events: FairEvent[]): CalendarMonth[] {
  const keys = new Set<string>();
  for (const event of events) {
    keys.add(manilaDateKey(event.start_at).slice(0, 7));
  }

  return Array.from(keys)
    .sort()
    .map((ym) => {
      const [y, m] = ym.split("-").map(Number);
      return {
        year: y,
        month: m,
        label: monthLabel(y, m),
      };
    });
}

/** Fallback shell month when there are no events yet. */
export function fallbackCalendarMonth(now = new Date()): CalendarMonth {
  const key = manilaDateKey(now.toISOString());
  const [y, m] = key.split("-").map(Number);
  return { year: y, month: m, label: monthLabel(y, m) };
}

export function eventsByDateKey(
  events: FairEvent[],
): Map<string, FairEvent[]> {
  const map = new Map<string, FairEvent[]>();
  for (const event of events) {
    const key = manilaDateKey(event.start_at);
    const list = map.get(key);
    if (list) list.push(event);
    else map.set(key, [event]);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.start_at.localeCompare(b.start_at));
  }
  return map;
}
