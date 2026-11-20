import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-session";
import { ADMIN_LOGIN_EMAIL } from "@/lib/auth-credentials";
import type { Database } from "./database.types";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "./env";

function isHardcodedAdminEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase() === ADMIN_LOGIN_EMAIL.toLowerCase();
}

function applySecurityHeaders(response: NextResponse) {
  const supabaseHost = (() => {
    try {
      return supabaseUrl ? new URL(supabaseUrl).origin : "";
    } catch {
      return "";
    }
  })();

  // Allow both HTTPS API and WSS realtime; Safari/WebKit enforce connect-src by scheme.
  const supabaseWss = supabaseHost.replace(/^https:/i, "wss:");
  const connectSrc = [
    "'self'",
    supabaseHost,
    supabaseWss,
    "https://*.supabase.co",
    "wss://*.supabase.co",
  ]
    .filter(Boolean)
    .join(" ");

  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      `connect-src ${connectSrc}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  );
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export async function updateSession(request: NextRequest) {
  let response = applySecurityHeaders(NextResponse.next({ request }));
  const { pathname } = request.nextUrl;
  const needsAuth = pathname.startsWith("/admin");
  const hasAdminSession = verifyAdminSessionToken(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
  );

  if (hasAdminSession) {
    if (pathname === "/login") {
      return applySecurityHeaders(
        redirectWithCookies(request, response, "/admin"),
      );
    }
    return response;
  }

  if (!isSupabaseConfigured) {
    if (needsAuth) {
      return applySecurityHeaders(
        redirectWithCookies(request, response, "/login", pathname),
      );
    }
    return response;
  }

  // Public pages with no Supabase auth cookie skip getClaims — saves a round trip.
  const hasSupabaseAuthCookie = request.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"),
    );
  if (!needsAuth && pathname !== "/login" && !hasSupabaseAuthCookie) {
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
        response = applySecurityHeaders(NextResponse.next({ request }));
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
    return applySecurityHeaders(
      redirectWithCookies(request, response, "/login", pathname),
    );
  }

  if (pathname.startsWith("/admin") && userId) {
    if (!isHardcodedAdminEmail(claimEmail)) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (!profile?.role) {
        return applySecurityHeaders(
          redirectWithCookies(
            request,
            response,
            "/login",
            pathname,
            "unauthorized",
          ),
        );
      }
    }
  }

  if (pathname === "/login" && userId) {
    if (isHardcodedAdminEmail(claimEmail)) {
      return applySecurityHeaders(
        redirectWithCookies(request, response, "/admin"),
      );
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (profile?.role) {
      return applySecurityHeaders(
        redirectWithCookies(request, response, "/admin"),
      );
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
