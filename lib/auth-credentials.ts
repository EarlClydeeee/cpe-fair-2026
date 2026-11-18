function isProdLike() {
  return process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
}

/** Fixed Supabase auth email for the access-code login. Not shown in the UI. */
export const ADMIN_LOGIN_EMAIL =
  process.env.ADMIN_LOGIN_EMAIL?.trim() || "admin@gmail.com";

/**
 * Control-room access code.
 * Required in production/Vercel (fail closed). Dev-only default for local DX.
 */
export function getAdminAccessCode(): string {
  const code = process.env.ADMIN_ACCESS_CODE?.trim() ?? "";
  if (code) return code;
  if (isProdLike()) {
    throw new Error(
      "Missing ADMIN_ACCESS_CODE. Set a strong unique code in Vercel env vars.",
    );
  }
  return "Admin1234";
}

/** @deprecated Prefer getAdminAccessCode() — kept for call sites that need a string at import time in dev. */
export const ADMIN_ACCESS_CODE = process.env.ADMIN_ACCESS_CODE?.trim() || "";
