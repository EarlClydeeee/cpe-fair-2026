import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Enums } from "./supabase/database.types";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "./admin-session";
import { ADMIN_LOGIN_EMAIL } from "./auth-credentials";
import { isSupabaseConfigured } from "./supabase/env";
import { createClient } from "./supabase/server";

export type AdminRole = Enums<"admin_role">;

export type CurrentUser = {
  id: string;
  email: string | null;
  fullName: string;
  role: AdminRole | null;
};

function isHardcodedAdminEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase() === ADMIN_LOGIN_EMAIL.toLowerCase();
}

export async function hasVerifiedAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (await hasVerifiedAdminSession()) {
    return {
      id: "hardcoded-admin",
      email: ADMIN_LOGIN_EMAIL,
      fullName: "Admin",
      role: "owner",
    };
  }

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

  const email = profile?.email ?? data?.claims?.email;
  if (isHardcodedAdminEmail(typeof email === "string" ? email : null)) {
    return {
      id,
      email: ADMIN_LOGIN_EMAIL,
      fullName: profile?.full_name || "Admin",
      role: "owner",
    };
  }

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
