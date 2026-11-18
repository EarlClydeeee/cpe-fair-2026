"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fieldErrors, formObject, type ActionState } from "@/lib/action-state";
import { ADMIN_LOGIN_EMAIL } from "@/lib/auth-credentials";
import { createClient } from "@/lib/supabase/server";
import { signInSchema } from "@/lib/validation/auth";

function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signInSchema.safeParse(formObject(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: ADMIN_LOGIN_EMAIL,
    password: parsed.data.password,
  });

  if (error) return { ok: false, message: "Invalid access code." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.role) {
      await supabase.auth.signOut();
      return { ok: false, message: "This account is not authorized for the control room." };
    }
  }

  redirect(safeNext(parsed.data.next));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete("cpe_admin_session");
  redirect("/");
}
