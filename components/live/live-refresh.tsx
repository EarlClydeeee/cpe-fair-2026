"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const DEFAULT_INTERVAL_MS = 10_000;

/** Polls the current route so server standings/events re-render after publish. */
export function LiveRefresh({ intervalMs = DEFAULT_INTERVAL_MS }: { intervalMs?: number }) {
  const router = useRouter();
  const [updatedAt, setUpdatedAt] = useState(() => new Date());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const refreshId = window.setInterval(() => {
      router.refresh();
      setUpdatedAt(new Date());
    }, intervalMs);
    const tickId = window.setInterval(() => setTick((n) => n + 1), 1_000);
    return () => {
      window.clearInterval(refreshId);
      window.clearInterval(tickId);
    };
  }, [router, intervalMs]);

  const secondsAgo = Math.max(
    0,
    Math.floor((Date.now() - updatedAt.getTime()) / 1000),
  );
  void tick;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-accent-soft px-3 py-1.5 text-[10px] font-bold tracking-[0.18em] text-accent uppercase">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-accent" />
        </span>
        Live
      </span>
      <span className="text-[10px] tracking-[0.14em] text-muted uppercase">
        Auto-refresh · {intervalMs / 1000}s
      </span>
      <span className="text-[10px] tracking-[0.14em] text-muted uppercase">
        Updated {secondsAgo === 0 ? "just now" : `${secondsAgo}s ago`}
      </span>
    </div>
  );
}
