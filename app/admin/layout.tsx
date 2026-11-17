import { Suspense } from "react";
import { connection } from "next/server";
import { AdminShell } from "@/components/admin-shell";
import { requireStaff } from "@/lib/auth";
import { getActiveSeason } from "@/lib/data/public";

export const instant = false;

function AdminShellFallback() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden w-64 shrink-0 border-r border-border bg-surface md:block" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-14 border-b border-border bg-surface md:hidden" />
        <div className="hidden h-14 border-b border-border bg-surface md:block" />
        <div className="flex-1 p-4 text-sm text-muted sm:p-6">Loading admin…</div>
      </div>
    </div>
  );
}

async function AdminAuthenticatedShell({ children }: { children: React.ReactNode }) {
  // Exclude Supabase auth (uses Date.now for session expiry) from Cache Components prerender.
  await connection();
  const user = await requireStaff();
  const season = await getActiveSeason();

  return (
    <AdminShell role={user.role} seasonName={season?.name ?? "CPE Fair 2026"}>
      {children}
    </AdminShell>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AdminShellFallback />}>
      <AdminAuthenticatedShell>{children}</AdminAuthenticatedShell>
    </Suspense>
  );
}
