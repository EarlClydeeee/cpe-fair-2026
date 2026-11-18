"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fieldErrors, formObject, type ActionState } from "@/lib/action-state";
import {
  ADMIN_ACCESS_CODE,
  ADMIN_LOGIN_EMAIL,
} from "@/lib/auth-credentials";
import { createClient } from "@/lib/supabase/server";
import { signInSchema } from "@/lib/validation/auth";

function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
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

  const cookieStore = await cookies();
  cookieStore.set("cpe_admin_session", "authenticated", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  // Best-effort Supabase session so RPCs can run as authenticated when the user exists.
  try {
    const supabase = await createClient();
    await supabase.auth.signInWithPassword({
      email: ADMIN_LOGIN_EMAIL,
      password: ADMIN_ACCESS_CODE,
    });
  } catch {
    // Cookie session is enough for control-room UI access.
  }

  redirect(safeNext(parsed.data.next));
}

export async function signOut() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
  const cookieStore = await cookies();
  cookieStore.delete("cpe_admin_session");
  redirect("/");
}
