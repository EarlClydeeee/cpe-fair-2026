import type { Metadata } from "next";
import { AccessPanel } from "@/components/admin/access-panel";
import { requireStaff } from "@/lib/auth";
import { getAccessDirectory } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Admin access" };

export default async function AdminAccessPage() {
  const user = await requireStaff("/admin/access");
  const { profiles, invites } = await getAccessDirectory();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-5xl">Admin Access</h1>
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
