import { describe, it, expect, vi } from "vitest";
import { logger } from "./logger";
import * as Sentry from "@sentry/nextjs";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

describe("Structured Logger", () => {
  it("logs info without throwing", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("Test info message", { orderId: "ord-123" });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("redacts sensitive fields like token and password", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("Test error message", new Error("Boom"), {
      apiKey: "secret-123",
      userPassword: "password456",
      phoneNumber: "081234567890",
      accountNumber: "123456789",
      email: "buyer@example.com",
      authorization: "Bearer secret-token",
      normalField: "public-val",
    });
    expect(consoleSpy).toHaveBeenCalled();
    const args = consoleSpy.mock.calls[0];
    const loggedContext = args[1] as Record<string, unknown>;
    expect(loggedContext.apiKey).toBe("[REDACTED]");
    expect(loggedContext.userPassword).toBe("[REDACTED]");
    expect(loggedContext.phoneNumber).toBe("[REDACTED]");
    expect(loggedContext.accountNumber).toBe("[REDACTED]");
    expect(loggedContext.email).toBe("[REDACTED]");
    expect(loggedContext.authorization).toBe("[REDACTED]");
    expect(loggedContext.normalField).toBe("public-val");
    consoleSpy.mockRestore();
  });

  it("supports (message, context) 2-argument signature for error (A6)", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("health.check_failed", { reason: "database timeout" });
    expect(consoleSpy).toHaveBeenCalled();
    const args = consoleSpy.mock.calls[0];
    const loggedContext = args[1] as Record<string, unknown>;
    expect(loggedContext.reason).toBe("database timeout");
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: { event: "health.check_failed" },
        extra: { reason: "database timeout" },
      }),
    );
    consoleSpy.mockRestore();
  });
});
