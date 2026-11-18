"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { fieldErrors, formObject, type ActionState } from "@/lib/action-state";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
} from "@/lib/admin-session";
import { getAdminAccessCode } from "@/lib/auth-credentials";
import {
  clearLoginFailures,
  getClientIp,
  isLoginRateLimited,
  recordLoginFailure,
} from "@/lib/login-rate-limit";
import { hasServiceRole } from "@/lib/supabase/env";
import { createAuthClient, createServiceClient } from "@/lib/supabase/server";
import { signInSchema } from "@/lib/validation/auth";
import { getActiveSeason } from "@/lib/data/public";

function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/admin";
}

export async function signIn(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const headerStore = await headers();
  const ip = getClientIp(headerStore);

  if (isLoginRateLimited(ip)) {
    return {
      ok: false,
      message: "Too many attempts. Try again in a few minutes.",
    };
  }

  const parsed = signInSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  let accessCode: string;
  try {
    accessCode = getAdminAccessCode();
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Access code not configured.",
    };
  }

  if (parsed.data.password !== accessCode) {
    recordLoginFailure(ip);
    return { ok: false, message: "Invalid access code." };
  }

  let token: string;
  try {
    token = createAdminSessionToken();
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Session secret not configured.",
    };
  }

  clearLoginFailures(ip);

  if (hasServiceRole) {
    try {
      const supabase = createServiceClient();
      const season = await getActiveSeason();
      const ua = headerStore.get("user-agent")?.slice(0, 160) ?? "";
      await supabase.from("audit_log").insert({
        season_id: season?.id,
        actor_id: null,
        action: "admin_login",
        entity_type: "session",
        summary: `Access-code login from ${ip}${ua ? ` · ${ua}` : ""}`,
        after_json: { ip, ua } as never,
      });
    } catch {
      // Login should still succeed if audit insert fails (e.g. enum not migrated yet).
    }
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    ...adminSessionCookieOptions(),
  });

  redirect(safeNext(parsed.data.next));
}

export async function signOut() {
  try {
    const supabase = await createAuthClient();
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  redirect("/");
}
