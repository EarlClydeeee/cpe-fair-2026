import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { AccessPanel } from "@/components/admin/access-panel";
import { requireStaff } from "@/lib/auth";
import { getAccessDirectory } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Admin access" };
export const instant = false;

async function AccessContent() {
  await connection();
  const user = await requireStaff("/admin/access");
  const { profiles, invites } = await getAccessDirectory();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl leading-none sm:text-5xl">
          Admin Access
        </h1>
        <p className="mt-2 text-sm text-muted">
          Invite trusted organizers and keep control-room permissions clear.
        </p>
      </div>
      <AccessPanel
        profiles={profiles as never}
        invites={invites as never}
        isOwner={user.role === "owner"}
      />
    </div>
  );
}

export default function AdminAccessPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
          Loading access…
        </div>
      }
    >
      <AccessContent />
    </Suspense>
  );
}
