import "server-only";

/** Fixed Supabase auth email for the access-code login. Not shown in the UI. */
export const ADMIN_LOGIN_EMAIL =
  process.env.ADMIN_LOGIN_EMAIL?.trim() || "admin@gmail.com";

/** Hardcoded control-room access code. */
export const ADMIN_ACCESS_CODE =
  process.env.ADMIN_ACCESS_CODE?.trim() || "Admin1234";
