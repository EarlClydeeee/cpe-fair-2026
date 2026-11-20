import type { Metadata } from "next";
import Link from "next/link";
import { FacebookLivePlayer } from "@/components/live/facebook-live-player";
import { Badge } from "@/components/ui/badge";
import { getLiveBroadcast } from "@/lib/data/public";
import { isFacebookUrl } from "@/lib/facebook-live";

export const metadata: Metadata = {
  title: "Live",
  description: "Watch ACCESS CPE Fair 2026 live on Facebook.",
};
export const instant = false;

export default async function LivePage() {
  const broadcast = await getLiveBroadcast();
  const isOnAir =
    Boolean(broadcast?.is_active) &&
    Boolean(broadcast?.facebook_url) &&
    isFacebookUrl(broadcast?.facebook_url ?? "");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="reveal flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] text-accent uppercase sm:text-xs">
            Watch along
          </p>
          <h1 className="mt-2 font-display text-4xl leading-none sm:text-6xl">
            {isOnAir ? broadcast!.title : "Live"}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            {isOnAir
              ? "Streaming from Facebook. Chat and reactions stay on Facebook."
              : "When the fair goes live, the Facebook stream will appear here."}
          </p>
        </div>
        <Badge tone={isOnAir ? "success" : "muted"}>
          {isOnAir ? "On air" : "Offline"}
        </Badge>
      </div>

      <div className="dash-rule my-6 sm:my-8" />

      {isOnAir ? (
        <div className="space-y-4">
          <FacebookLivePlayer
            facebookUrl={broadcast!.facebook_url}
            title={broadcast!.title}
          />
          <div className="flex flex-wrap gap-3">
            <a
              href={broadcast!.facebook_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Watch on Facebook
            </a>
            <Link
              href="/events"
              className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface-2 px-4 text-sm text-muted transition-colors hover:text-foreground"
            >
              View schedule
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-16 text-center">
          <p className="font-display text-2xl tracking-wide sm:text-3xl">
            Stream is offline
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
            Check back when organizers start the Facebook Live, or follow the
            schedule for upcoming matches.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/events"
              className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              View events
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface-2 px-4 text-sm text-muted transition-colors hover:text-foreground"
            >
              Leaderboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
