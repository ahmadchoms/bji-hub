import { describe, it, expect, vi, afterEach } from "vitest";
import { verifyTurnstileToken } from "./turnstile";

describe("verifyTurnstileToken", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("bypasses verification in non-production when secret key is missing", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    vi.stubEnv("NODE_ENV", "test");

    const result = await verifyTurnstileToken("dummy-token");
    expect(result).toBe(true);
  });

  it("fails verification in production when secret key is missing", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    vi.stubEnv("NODE_ENV", "production");

    const result = await verifyTurnstileToken("dummy-token");
    expect(result).toBe(false);
  });

  it("rejects empty token when secret key is present", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "1x0000000000000000000000000000000AA");

    const result = await verifyTurnstileToken("");
    expect(result).toBe(false);
  });
});
