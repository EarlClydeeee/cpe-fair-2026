import "server-only";
import { timingSafeEqual } from "node:crypto";
import { getAdminAccessCode } from "./auth-credentials";

/** Re-auth gate for destructive admin actions. */
export function confirmAccessCode(value: string | undefined | null): boolean {
  if (!value) return false;
  let expected: string;
  try {
    expected = getAdminAccessCode();
  } catch {
    return false;
  }
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
