import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "cpe_admin_session";
/** Fixed 12-hour session lifetime. */
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;

type SessionPayload = {
  v: 1;
  iat: number;
  exp: number;
  sid: string;
};

function isProdLike() {
  return process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
}

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim() ?? "";
  if (secret) return secret;
  if (isProdLike()) {
    throw new Error(
      "Missing ADMIN_SESSION_SECRET. Set it in Vercel / production env vars.",
    );
  }
  // Local DX only — never used on Vercel/production.
  return "dev-only-admin-session-secret";
}

function b64url(input: Buffer | string) {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function fromB64url(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, "base64");
}

function sign(payloadPart: string) {
  return b64url(
    createHmac("sha256", getSessionSecret()).update(payloadPart).digest(),
  );
}

export function createAdminSessionToken(now = Date.now()): string {
  const payload: SessionPayload = {
    v: 1,
    iat: Math.floor(now / 1000),
    exp: Math.floor(now / 1000) + ADMIN_SESSION_MAX_AGE,
    sid: b64url(randomBytes(16)),
  };
  const payloadPart = b64url(JSON.stringify(payload));
  return `${payloadPart}.${sign(payloadPart)}`;
}

export function verifyAdminSessionToken(
  value: string | undefined | null,
  now = Date.now(),
): boolean {
  if (!value || value === "authenticated") return false;
  const [payloadPart, signature] = value.split(".");
  if (!payloadPart || !signature) return false;

  let expected: string;
  try {
    expected = sign(payloadPart);
  } catch {
    return false;
  }

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  try {
    const payload = JSON.parse(
      fromB64url(payloadPart).toString("utf8"),
    ) as SessionPayload;
    if (payload.v !== 1) return false;
    if (!payload.exp || payload.exp * 1000 <= now) return false;
    if (!payload.iat || !payload.sid) return false;
    return true;
  } catch {
    return false;
  }
}

export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProdLike(),
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  };
}
