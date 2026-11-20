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

function withHttps(raw: string) {
  if (raw.startsWith("http://")) return `https://${raw.slice("http://".length)}`;
  if (raw.startsWith("//")) return `https:${raw}`;
  return raw;
}

/** Pull a usable Facebook URL out of a bare link or pasted iframe embed code. */
export function extractFacebookUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const iframeSrc = trimmed.match(
    /src=["'](https?:\/\/(?:www\.)?facebook\.com\/plugins\/video\.php[^"']+)["']/i,
  );
  if (iframeSrc?.[1]) {
    try {
      const plugin = new URL(iframeSrc[1]);
      const href = plugin.searchParams.get("href");
      if (href) return withHttps(decodeURIComponent(href));
    } catch {
      /* fall through */
    }
  }

  const pluginMatch = trimmed.match(
    /^https?:\/\/(?:www\.)?facebook\.com\/plugins\/video\.php\?[^\s]+$/i,
  );
  if (pluginMatch) {
    try {
      const plugin = new URL(trimmed);
      const href = plugin.searchParams.get("href");
      if (href) return withHttps(decodeURIComponent(href));
    } catch {
      /* fall through */
    }
  }

  const firstUrl = trimmed.match(/https?:\/\/[^\s"'<>]+/i);
  return firstUrl ? withHttps(firstUrl[0]) : withHttps(trimmed);
}

export function isFacebookUrl(raw: string): boolean {
  const candidate = extractFacebookUrl(raw);
  if (!candidate) return false;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    return FACEBOOK_HOSTS.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

/** Canonical watch URL for storage / "Open on Facebook". */
export function normalizeFacebookWatchUrl(raw: string): string | null {
  const candidate = extractFacebookUrl(raw);
  if (!isFacebookUrl(candidate)) return null;

  try {
    const url = new URL(candidate);
    url.protocol = "https:";
    if (url.hostname === "facebook.com" || url.hostname === "m.facebook.com" || url.hostname === "web.facebook.com") {
      url.hostname = "www.facebook.com";
    }
    // Drop tracking params that can break embeds.
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return candidate;
  }
}

function extractVideoId(watchUrl: string): string | null {
  try {
    const url = new URL(watchUrl);
    const fromVideos = url.pathname.match(/\/videos\/(?:[^/]+\/)?(\d+)/);
    if (fromVideos?.[1]) return fromVideos[1];
    const fromReel = url.pathname.match(/\/(?:reel|reels)\/(\d+)/);
    if (fromReel?.[1]) return fromReel[1];
    const v = url.searchParams.get("v");
    if (v && /^\d+$/.test(v)) return v;
  } catch {
    /* ignore */
  }
  return null;
}

/** Build the Facebook video plugin iframe src from a public FB video/live URL. */
export function facebookVideoEmbedSrc(raw: string): string | null {
  const watchUrl = normalizeFacebookWatchUrl(raw);
  if (!watchUrl) return null;

  const params = new URLSearchParams({
    href: watchUrl,
    show_text: "false",
    width: "1280",
  });

  return `https://www.facebook.com/plugins/video.php?${params.toString()}`;
}

/** Alternate embed used by Graph API responses; useful when plugin href fails. */
export function facebookVideoIdEmbedSrc(raw: string): string | null {
  const watchUrl = normalizeFacebookWatchUrl(raw);
  if (!watchUrl) return null;
  const id = extractVideoId(watchUrl);
  if (!id) return null;
  return `https://www.facebook.com/video/embed?video_id=${id}`;
}
