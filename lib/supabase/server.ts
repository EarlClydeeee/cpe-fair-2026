import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-session";
import type { Database } from "./database.types";
import {
  hasServiceRole,
  supabaseKey,
  supabaseServiceRoleKey,
  supabaseUrl,
} from "./env";

/** Privileged client — bypasses RLS. Only for verified signed admin sessions. */
export function createServiceClient() {
  if (!hasServiceRole) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local from Supabase → Project Settings → API.",
    );
  }
  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function createUserServerClient() {
  const cookieStore = await cookies();
  await connection();

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components cannot set cookies; proxy.ts refreshes the session instead.
        }
      },
    },
  });
}

export async function createClient() {
  const cookieStore = await cookies();
  await connection();

  // Signed control-room session: service role only after HMAC verification.
  if (
    verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value) &&
    hasServiceRole
  ) {
    return createServiceClient();
  }

  return createUserServerClient();
}

export async function createAuthClient() {
  return createUserServerClient();
}
