"use client";

import {
  facebookVideoEmbedSrc,
  normalizeFacebookWatchUrl,
} from "@/lib/facebook-live";

export function FacebookLivePlayer({
  facebookUrl,
  title,
}: {
  facebookUrl: string;
  title: string;
}) {
  const src = facebookVideoEmbedSrc(facebookUrl);
  const watchUrl = normalizeFacebookWatchUrl(facebookUrl) ?? facebookUrl;

  if (!src) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface px-6 text-center">
        <p className="text-sm text-muted">
          This Facebook link could not be embedded.
        </p>
        <a
          href={watchUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-medium text-background"
        >
          Watch on Facebook
        </a>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-[0_0_40px_rgba(255,107,33,0.08)]">
      <div className="relative aspect-video w-full">
        <iframe
          title={title}
          src={src}
          className="absolute inset-0 h-full w-full border-0"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen"
          allowFullScreen
        />
      </div>
      <p className="border-t border-border/60 px-4 py-3 text-xs leading-5 text-muted">
        If you see &ldquo;Video Unavailable,&rdquo; the Facebook post must be{" "}
        <span className="text-foreground">Public</span>, and for Live streams
        turn on <span className="text-foreground">Embed Live video</span> in
        Live Producer (Settings → Stream). Then paste the fresh video URL or
        Facebook&apos;s embed code.
      </p>
    </div>
  );
}
