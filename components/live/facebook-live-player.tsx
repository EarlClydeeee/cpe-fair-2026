"use client";

import { facebookVideoEmbedSrc } from "@/lib/facebook-live";

export function FacebookLivePlayer({
  facebookUrl,
  title,
}: {
  facebookUrl: string;
  title: string;
}) {
  const src = facebookVideoEmbedSrc(facebookUrl);
  if (!src) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-border bg-surface px-6 text-center text-sm text-muted">
        This Facebook link could not be embedded. Open it on Facebook instead.
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
          loading="lazy"
        />
      </div>
    </div>
  );
}
