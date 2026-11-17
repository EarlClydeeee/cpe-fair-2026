import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import type { Database } from "./database.types";
import { supabaseKey, supabaseUrl } from "./env";

export async function createClient() {
  const cookieStore = await cookies();
  // Supabase auth session expiry checks call Date.now(); wait for the request first.
  await connection();

  // #region agent log
  fetch("http://127.0.0.1:7912/ingest/c1c12f56-2425-4c76-b3de-7fa974d28ed2", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "da5f1d" },
    body: JSON.stringify({
      sessionId: "da5f1d",
      runId: "post-fix-3",
      hypothesisId: "G",
      location: "lib/supabase/server.ts:createClient",
      message: "createClient after cookies()+connection()",
      data: {},
      timestamp: Math.trunc(performance.now()),
    }),
  }).catch(() => {});
  // #endregion

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
