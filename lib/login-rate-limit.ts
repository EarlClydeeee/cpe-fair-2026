import "server-only";

type Bucket = { failures: number[]; };

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

/** Best-effort in-memory limiter (per server instance). */
const buckets = new Map<string, Bucket>();

function prune(bucket: Bucket, now: number) {
  bucket.failures = bucket.failures.filter((t) => now - t < WINDOW_MS);
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

export function isLoginRateLimited(ip: string, now = Date.now()): boolean {
  const bucket = buckets.get(ip);
  if (!bucket) return false;
  prune(bucket, now);
  return bucket.failures.length >= MAX_FAILURES;
}

export function recordLoginFailure(ip: string, now = Date.now()) {
  const bucket = buckets.get(ip) ?? { failures: [] };
  prune(bucket, now);
  bucket.failures.push(now);
  buckets.set(ip, bucket);
}

export function clearLoginFailures(ip: string) {
  buckets.delete(ip);
}
