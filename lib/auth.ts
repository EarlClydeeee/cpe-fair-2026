import "server-only";
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
  // Legacy cpe_admin_session cookie is ignored (cleared in proxy / signOut).
  // App auth must use a real Supabase JWT so RPCs run as authenticated.
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
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
