const timeOnly = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dateTime = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatTime(iso: string) {
  return timeOnly.format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return dateTime.format(new Date(iso));
}

export function formatPoints(n: number) {
  return n.toLocaleString("en-US");
}

export function dayLabel(n: number) {
  return `Day ${String(n).padStart(2, "0")}`;
}

export function eventStatusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export function roleLabel(role: string) {
  return role.replaceAll("_", " ");
}
