"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fieldErrors, formObject, type ActionState } from "@/lib/action-state";
import { ADMIN_ACCESS_CODE } from "@/lib/auth-credentials";
import { hasServiceRole } from "@/lib/supabase/env";
import { createAuthClient } from "@/lib/supabase/server";
import { signInSchema } from "@/lib/validation/auth";

function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/admin";
}

export async function signIn(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signInSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  if (parsed.data.password !== ADMIN_ACCESS_CODE) {
    return { ok: false, message: "Invalid access code." };
  }

  if (!hasServiceRole) {
    return {
      ok: false,
      message:
        "Add SUPABASE_SERVICE_ROLE_KEY to .env.local (Supabase → Project Settings → API → service_role secret).",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: "cpe_admin_session",
    value: "authenticated",
    httpOnly: true,
    sameSite: "lax",
    secure:
      process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL),
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
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
  cookieStore.delete("cpe_admin_session");
  redirect("/");
}
