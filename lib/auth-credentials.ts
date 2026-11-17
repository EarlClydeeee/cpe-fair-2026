import "server-only";

/** Fixed Supabase auth email for the access-code login. Not shown in the UI. */
export const ADMIN_LOGIN_EMAIL =
  process.env.ADMIN_LOGIN_EMAIL?.trim() || "admin@gmail.com";
