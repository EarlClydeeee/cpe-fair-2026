import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Enums } from "./supabase/database.types";
import { isSupabaseConfigured } from "./supabase/env";
import { createClient } from "./supabase/server";

export type AdminRole = Enums<"admin_role">;

export type CurrentUser = {
  id: string;
  email: string | null;
  fullName: string;
  role: AdminRole | null;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // #region agent log
  fetch("http://127.0.0.1:7912/ingest/c1c12f56-2425-4c76-b3de-7fa974d28ed2", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "da5f1d" },
    body: JSON.stringify({
      sessionId: "da5f1d",
      runId: "post-fix-2",
      hypothesisId: "B",
      location: "lib/auth.ts:getCurrentUser:before-cookies",
      message: "getCurrentUser before cookies()",
      data: {},
      timestamp: Math.trunc(performance.now()),
    }),
  }).catch(() => {});
  // #endregion

  await cookies();

  // #region agent log
  fetch("http://127.0.0.1:7912/ingest/c1c12f56-2425-4c76-b3de-7fa974d28ed2", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "da5f1d" },
    body: JSON.stringify({
      sessionId: "da5f1d",
      runId: "post-fix-2",
      hypothesisId: "B",
      location: "lib/auth.ts:getCurrentUser:after-cookies",
      message: "getCurrentUser after cookies() (no connection here)",
      data: { supabaseConfigured: isSupabaseConfigured },
      timestamp: Math.trunc(performance.now()),
    }),
  }).catch(() => {});
  // #endregion

  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();

  // #region agent log
  fetch("http://127.0.0.1:7912/ingest/c1c12f56-2425-4c76-b3de-7fa974d28ed2", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "da5f1d" },
    body: JSON.stringify({
      sessionId: "da5f1d",
      runId: "post-fix-2",
      hypothesisId: "C",
      location: "lib/auth.ts:getCurrentUser:before-getClaims",
      message: "getCurrentUser before getClaims",
      data: {},
      timestamp: Math.trunc(performance.now()),
    }),
  }).catch(() => {});
  // #endregion

  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;

  // #region agent log
  fetch("http://127.0.0.1:7912/ingest/c1c12f56-2425-4c76-b3de-7fa974d28ed2", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "da5f1d" },
    body: JSON.stringify({
      sessionId: "da5f1d",
      runId: "post-fix-2",
      hypothesisId: "C",
      location: "lib/auth.ts:getCurrentUser:after-getClaims",
      message: "getCurrentUser after getClaims",
      data: { hasSub: Boolean(id) },
      timestamp: Math.trunc(performance.now()),
    }),
  }).catch(() => {});
  // #endregion

  if (!id) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", id)
    .maybeSingle();

  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
  };
});

export async function requireStaff(next = "/admin") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!user.role) redirect("/login?error=unauthorized");
  return user as CurrentUser & { role: AdminRole };
}

export async function requireOwner() {
  const user = await requireStaff("/admin/access");
  if (user.role !== "owner") redirect("/admin");
  return user;
}

export function canScore(role: AdminRole | null) {
  return role === "owner" || role === "scoring_admin";
}

export function canManageEvents(role: AdminRole | null) {
  return role === "owner" || role === "site_admin" || role === "events_editor";
}

export function canManageContent(role: AdminRole | null) {
  return role === "owner" || role === "site_admin";
}

export { roleLabel } from "./roles";
