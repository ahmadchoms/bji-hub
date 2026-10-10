import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows requests under the limit and blocks when exceeded", () => {
    const key = `test-user-${Date.now()}`;
    const first = checkRateLimit(key, 2, 5000);
    expect(first.success).toBe(true);
    expect(first.remaining).toBe(1);

    const second = checkRateLimit(key, 2, 5000);
    expect(second.success).toBe(true);
    expect(second.remaining).toBe(0);

    const third = checkRateLimit(key, 2, 5000);
    expect(third.success).toBe(false);
    expect(third.remaining).toBe(0);
  });
});
