/** Normalize and validate Facebook video / live URLs for embedding. */

const FACEBOOK_HOSTS = new Set([
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "web.facebook.com",
  "fb.watch",
  "www.fb.watch",
  "fb.com",
  "www.fb.com",
]);

export function isFacebookUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    return FACEBOOK_HOSTS.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

/** Build the Facebook video plugin iframe src from a public FB video/live URL. */
export function facebookVideoEmbedSrc(raw: string): string | null {
  const trimmed = raw.trim();
  if (!isFacebookUrl(trimmed)) return null;

  const href = trimmed.startsWith("http://")
    ? `https://${trimmed.slice("http://".length)}`
    : trimmed;

  const params = new URLSearchParams({
    href,
    show_text: "false",
    width: "1280",
  });

  return `https://www.facebook.com/plugins/video.php?${params.toString()}`;
}
