/**
 * In-memory sliding-window rate limiter for server actions & route handlers.
 * ponytail: in-memory Map with auto-pruning. Replace with Upstash Redis if multi-instance cluster.
 */
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitBucket>();

export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60_000
): { success: boolean; remaining: number } {
  const now = Date.now();
  const bucket = store.get(key);

  // Auto clean stale buckets
  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { success: false, remaining: 0 };
  }

  bucket.count += 1;
  return { success: true, remaining: limit - bucket.count };
}
