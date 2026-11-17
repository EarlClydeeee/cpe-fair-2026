import { Suspense } from "react";
import { connection } from "next/server";
import { AdminSidebar, AdminTopBar } from "@/components/admin-shell";
import { requireStaff } from "@/lib/auth";
import { getActiveSeason } from "@/lib/data/public";

export const instant = false;

function AdminShellFallback() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden w-64 shrink-0 border-r border-border bg-surface md:block" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-14 border-b border-border bg-surface" />
        <div className="flex-1 p-6 text-sm text-muted">Loading admin…</div>
      </div>
    </div>
  );
}

async function AdminAuthenticatedShell({ children }: { children: React.ReactNode }) {
  // #region agent log
  fetch("http://127.0.0.1:7912/ingest/c1c12f56-2425-4c76-b3de-7fa974d28ed2", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "da5f1d" },
    body: JSON.stringify({
      sessionId: "da5f1d",
      runId: "post-fix-2",
      hypothesisId: "E",
      location: "app/admin/layout.tsx:shell:before-connection",
      message: "AdminAuthenticatedShell before connection()",
      data: {},
      timestamp: Math.trunc(performance.now()),
    }),
  }).catch(() => {});
  // #endregion

  await connection();

  // #region agent log
  fetch("http://127.0.0.1:7912/ingest/c1c12f56-2425-4c76-b3de-7fa974d28ed2", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "da5f1d" },
    body: JSON.stringify({
      sessionId: "da5f1d",
      runId: "post-fix-2",
      hypothesisId: "E",
      location: "app/admin/layout.tsx:shell:after-connection",
      message: "AdminAuthenticatedShell after connection()",
      data: {},
      timestamp: Math.trunc(performance.now()),
    }),
  }).catch(() => {});
  // #endregion

  const user = await requireStaff();

  // #region agent log
  fetch("http://127.0.0.1:7912/ingest/c1c12f56-2425-4c76-b3de-7fa974d28ed2", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "da5f1d" },
    body: JSON.stringify({
      sessionId: "da5f1d",
      runId: "post-fix-2",
      hypothesisId: "A",
      location: "app/admin/layout.tsx:shell:after-requireStaff",
      message: "AdminAuthenticatedShell after requireStaff",
      data: { hasUser: Boolean(user?.id), role: user?.role ?? null },
      timestamp: Math.trunc(performance.now()),
    }),
  }).catch(() => {});
  // #endregion

  const season = await getActiveSeason();

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar role={user.role} seasonName={season?.name ?? "CPE Fair 2026"} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar crumbs="Admin / Control room" role={user.role} />
        <div className="flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AdminShellFallback />}>
      <AdminAuthenticatedShell>{children}</AdminAuthenticatedShell>
    </Suspense>
  );
}
