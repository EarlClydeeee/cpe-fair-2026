"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const FALLBACK_POLL_MS = 15_000;
const DEBOUNCE_MS = 400;

const LIVE_TABLES = [
  "published_scores",
  "score_drafts",
  "events",
  "competition_teams",
  "live_broadcasts",
] as const;

/** Keep open pages in sync when fair data changes — no manual refresh. */
export function LiveDataSync() {
  const router = useRouter();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const refresh = () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        router.refresh();
        window.dispatchEvent(new CustomEvent("fair-live-refresh"));
      }, DEBOUNCE_MS);
    };

    if (!isSupabaseConfigured) {
      const id = window.setInterval(refresh, FALLBACK_POLL_MS);
      return () => {
        window.clearInterval(id);
        if (timerRef.current != null) window.clearTimeout(timerRef.current);
      };
    }

    const supabase = createClient();
    const channel = supabase.channel("fair-live-data");

    for (const table of LIVE_TABLES) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => refresh(),
      );
    }

    let pollId: number | null = null;
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        if (pollId != null) {
          window.clearInterval(pollId);
          pollId = null;
        }
        return;
      }
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        if (pollId == null) {
          pollId = window.setInterval(refresh, FALLBACK_POLL_MS);
        }
      }
    });

    // Safety net while realtime connects or if replication is not enabled yet.
    pollId = window.setInterval(refresh, FALLBACK_POLL_MS);

    return () => {
      if (pollId != null) window.clearInterval(pollId);
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
