/**
 * Rate limiter for server actions & route handlers.
 * Supports Upstash Redis REST when configured, with seamless in-memory fallback.
 */
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitBucket>();

function pruneStale(now: number) {
  if (store.size <= 5000) return;
  for (const [k, b] of store.entries()) {
    if (b.resetAt <= now) {
      store.delete(k);
    }
  }
}

export async function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60_000,
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  // 1. Upstash Redis REST pipeline if env variables are present
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    try {
      const url = process.env.UPSTASH_REDIS_REST_URL.replace(/\/$/, "");
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;
      const windowSec = Math.ceil(windowMs / 1000);
      const res = await fetch(`${url}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", `rl:${key}`],
          ["EXPIRE", `rl:${key}`, windowSec, "NX"],
          ["PTTL", `rl:${key}`],
        ]),
        signal: AbortSignal.timeout(2000),
      });

      if (res.ok) {
        const data = await res.json();
        const count = Number(data[0]?.result) || 1;
        const ttlMs = Number(data[2]?.result) || windowMs;
        const resetAt = Date.now() + Math.max(0, ttlMs);
        const remaining = Math.max(0, limit - count);
        return {
          success: count <= limit,
          remaining,
          resetAt,
        };
      }
    } catch {
      // Graceful fallback to memory store
    }
  }

  // 2. In-memory Map fallback
  const now = Date.now();
  pruneStale(now);

  const bucket = store.get(key);
  if (!bucket || now > bucket.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt };
  }

  if (bucket.count >= limit) {
    return { success: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { success: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}
