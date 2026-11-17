const MANILA_OFFSET = "+08:00";

const timeOnly = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const dateLong = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dateTime = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const manilaDateParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const manilaTimeParts = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function formatTime(iso: string) {
  return timeOnly.format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return dateTime.format(new Date(iso));
}

export function formatDateManila(iso: string) {
  return dateLong.format(new Date(iso));
}

/** e.g. Nov 23, 2026 · 3:30 PM – 5:30 PM */
export function formatEventWindow(startAt: string, endAt: string) {
  const date = formatDateManila(startAt);
  return `${date} · ${formatTime(startAt)} – ${formatTime(endAt)}`;
}

export function formatPoints(n: number) {
  return n.toLocaleString("en-US");
}

export function dayLabel(n: number) {
  return `Day ${String(n).padStart(2, "0")}`;
}

/** YYYY-MM-DD in Asia/Manila */
export function manilaDateKey(iso: string): string {
  return manilaDateParts.format(new Date(iso));
}

export function manilaDateInputValue(iso: string): string {
  return manilaDateKey(iso);
}

export type TwelveHourTime = {
  hour: string; // "1".."12"
  minute: string; // "00".."59"
  period: "AM" | "PM";
};

export function manilaTwelveHour(iso: string): TwelveHourTime {
  const parts = manilaTimeParts.formatToParts(new Date(iso));
  const hour = parts.find((p) => p.type === "hour")?.value ?? "12";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const dayPeriod = parts.find((p) => p.type === "dayPeriod")?.value ?? "AM";
  return {
    hour,
    minute: minute.padStart(2, "0"),
    period: dayPeriod.toUpperCase().startsWith("P") ? "PM" : "AM",
  };
}

function to24h(hour12: number, period: "AM" | "PM"): number {
  const h = ((hour12 - 1) % 12) + 1;
  if (period === "AM") return h === 12 ? 0 : h;
  return h === 12 ? 12 : h + 12;
}

/** Build an Asia/Manila timestamptz ISO string from date + 12h clock parts. */
export function manilaIsoFromParts(
  date: string,
  hour: string,
  minute: string,
  period: "AM" | "PM",
): string {
  const h = to24h(Number(hour), period);
  const m = minute.padStart(2, "0");
  const hh = String(h).padStart(2, "0");
  return new Date(`${date}T${hh}:${m}:00${MANILA_OFFSET}`).toISOString();
}

export function eventStatusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export function roleLabel(role: string) {
  return role.replaceAll("_", " ");
}
