const timeOnly = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const dateOnly = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dateShort = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  month: "short",
  day: "numeric",
});

const dateTime12 = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function formatTime(iso: string) {
  return timeOnly.format(new Date(iso));
}

export function formatDate(iso: string, includeYear = false) {
  const d = new Date(iso);
  return includeYear ? dateOnly.format(d) : dateShort.format(d);
}

export function formatDateTime(iso: string) {
  return dateTime12.format(new Date(iso));
}

export function formatPoints(n: number) {
  return n.toLocaleString("en-US");
}

export function dayLabel(n: number, dateIso?: string) {
  if (dateIso) {
    return dateShort.format(new Date(dateIso));
  }
  // Fallback day-to-date conversion for CPE Fair 2026
  const base = new Date("2026-11-17T00:00:00+08:00");
  base.setDate(base.getDate() + (Math.max(1, n) - 1));
  return dateShort.format(base);
}

export function eventStatusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export function roleLabel(role: string) {
  return role.replaceAll("_", " ");
}
