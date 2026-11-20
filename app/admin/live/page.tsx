import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { LiveBroadcastManager } from "@/components/admin/live-broadcast-manager";
import { canManageContent, requireStaff } from "@/lib/auth";
import { getAdminLiveBroadcast } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Live stream" };
export const instant = false;

async function LiveAdminContent() {
  await connection();
  const user = await requireStaff("/admin/live");
  if (!canManageContent(user.role)) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h1 className="font-display text-3xl leading-none">Live stream</h1>
        <p className="mt-3 text-sm text-muted">
          Site admin or owner access is required to manage the Facebook Live embed.
        </p>
      </div>
    );
  }

  const broadcast = await getAdminLiveBroadcast();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl leading-none sm:text-5xl">
          Live Stream
        </h1>
        <p className="mt-2 text-sm text-muted">
          Paste a public Facebook Live or video URL. It appears on{" "}
          <span className="text-foreground">/live</span> when you turn the stream on.
        </p>
      </div>
      <LiveBroadcastManager broadcast={broadcast} />
    </div>
  );
}

export default function AdminLivePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-10 w-48 animate-pulse rounded bg-surface-2" />
          <div className="h-64 animate-pulse rounded-2xl bg-surface-2" />
        </div>
      }
    >
      <LiveAdminContent />
    </Suspense>
  );
}
