"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fieldErrors, formObject, type ActionState } from "@/lib/action-state";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { signInSchema } from "@/lib/validation/auth";

const ADMIN_ACCESS_CODE = "4CCESS2627";

function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signInSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const { password, next } = parsed.data;

  if (password !== ADMIN_ACCESS_CODE) {
    return { ok: false, message: "Invalid access code. Access denied." };
  }

  const cookieStore = await cookies();
  cookieStore.set("cpe_admin_session", "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  redirect(safeNext(next));
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("cpe_admin_session");

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore signOut errors if supabase is unconfigured or unreachable
    }
  }

  redirect("/login");
}
