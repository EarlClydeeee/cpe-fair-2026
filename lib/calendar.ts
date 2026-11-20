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

/** Days in month (1–12). Leap-year safe via UTC date math. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** 0 = Sunday … 6 = Saturday for the 1st of the month (UTC noon avoids DST quirks). */
export function weekdayOfMonthStart(year: number, month: number): number {
  return new Date(Date.UTC(year, month - 1, 1, 12, 0, 0)).getUTCDay();
}

export function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function monthLabel(year: number, month: number): string {
  return `${MONTH_LABELS[month - 1]} ${year}`;
}

/** Sunday-first grid with leading/trailing null padding so length is a multiple of 7. */
export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const total = daysInMonth(year, month);
  const start = weekdayOfMonthStart(year, month);
  const cells: CalendarCell[] = [];

  for (let i = 0; i < start; i++) {
    cells.push({ dateKey: null, day: null });
  }
  for (let d = 1; d <= total; d++) {
    cells.push({ dateKey: dateKey(year, month, d), day: d });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ dateKey: null, day: null });
  }
  return cells;
}

export function parseDateKey(key: string): { year: number; month: number; day: number } | null {
  const m = key.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

/** Distinct months that contain at least one event (Manila start date), sorted. */
export function monthsSpannedByEvents(events: FairEvent[]): CalendarMonth[] {
  const map = new Map<string, CalendarMonth>();
  for (const event of events) {
    const key = manilaDateKey(event.start_at);
    const parts = parseDateKey(key);
    if (!parts) continue;
    const id = `${parts.year}-${parts.month}`;
    if (!map.has(id)) {
      map.set(id, {
        year: parts.year,
        month: parts.month,
        label: monthLabel(parts.year, parts.month),
      });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => a.year - b.year || a.month - b.month,
  );
}

export function fallbackCalendarMonth(now = new Date()): CalendarMonth {
  const key = manilaDateKey(now.toISOString());
  const parts = parseDateKey(key) ?? {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
  return {
    year: parts.year,
    month: parts.month,
    label: monthLabel(parts.year, parts.month),
  };
}

export function eventsByDateKey(events: FairEvent[]): Map<string, FairEvent[]> {
  const map = new Map<string, FairEvent[]>();
  for (const event of events) {
    const key = manilaDateKey(event.start_at);
    const list = map.get(key);
    if (list) list.push(event);
    else map.set(key, [event]);
  }
  return map;
}
