import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_LOGIN_EMAIL } from "@/lib/auth-credentials";
import type { Database } from "./database.types";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "./env";

function isHardcodedAdminEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase() === ADMIN_LOGIN_EMAIL.toLowerCase();
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;
  const needsAuth = pathname.startsWith("/admin");
  const hasAdminSession =
    request.cookies.get("cpe_admin_session")?.value === "authenticated";

  if (hasAdminSession) {
    if (pathname === "/login") {
      return redirectWithCookies(request, response, "/admin");
    }
    return response;
  }

  if (!isSupabaseConfigured) {
    if (needsAuth) {
      return redirectWithCookies(request, response, "/login", pathname);
    }
    return response;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  const claimEmail =
    typeof data?.claims?.email === "string" ? data.claims.email : null;

  if (needsAuth && !userId) {
    return redirectWithCookies(request, response, "/login", pathname);
  }

  if (pathname.startsWith("/admin") && userId) {
    if (!isHardcodedAdminEmail(claimEmail)) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (!profile?.role) {
        return redirectWithCookies(
          request,
          response,
          "/login",
          pathname,
          "unauthorized",
        );
      }
    }
  }

  if (pathname === "/login" && userId) {
    if (isHardcodedAdminEmail(claimEmail)) {
      return redirectWithCookies(request, response, "/admin");
    }
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
  error?: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = to;
  const params = new URLSearchParams();
  if (next) params.set("next", next);
  if (error) params.set("error", error);
  url.search = params.toString() ? `?${params}` : "";
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
