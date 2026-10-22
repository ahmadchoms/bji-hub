import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows requests under the limit and blocks when exceeded", async () => {
    const key = `test-user-${Date.now()}`;
    const first = await checkRateLimit(key, 2, 5000);
    expect(first.success).toBe(true);
    expect(first.remaining).toBe(1);
    expect(first.resetAt).toBeGreaterThan(Date.now());

    const second = await checkRateLimit(key, 2, 5000);
    expect(second.success).toBe(true);
    expect(second.remaining).toBe(0);

    const third = await checkRateLimit(key, 2, 5000);
    expect(third.success).toBe(false);
    expect(third.remaining).toBe(0);
  });
});
