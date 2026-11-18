import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "./env";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;
  const needsAuth = pathname.startsWith("/admin");

  // Clear legacy cookie if present; do not treat it as auth (needs Supabase JWT).
  if (request.cookies.get("cpe_admin_session")?.value) {
    response.cookies.delete("cpe_admin_session");
  }

  if (!isSupabaseConfigured) {
    if (needsAuth) return redirectWithCookies(request, response, "/login", pathname);
    return response;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (needsAuth && !userId) {
    return redirectWithCookies(request, response, "/login", pathname);
  }

  if (pathname.startsWith("/admin") && userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.role) {
      return redirectWithCookies(request, response, "/login", pathname);
    }
  }

  if (pathname === "/login" && userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (profile?.role) {
      return redirectWithCookies(request, response, "/admin");
    }
  }

  return response;
}

function redirectWithCookies(
  request: NextRequest,
  response: NextResponse,
  to: string,
  next?: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = to;
  url.search = next ? `?next=${encodeURIComponent(next)}` : "";
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
