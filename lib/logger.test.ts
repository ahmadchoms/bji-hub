import { describe, it, expect, vi } from "vitest";
import { logger } from "./logger";

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
      normalField: "public-val",
    });
    expect(consoleSpy).toHaveBeenCalled();
    const args = consoleSpy.mock.calls[0];
    const loggedContext = args[1] as Record<string, unknown>;
    expect(loggedContext.apiKey).toBe("[REDACTED]");
    expect(loggedContext.userPassword).toBe("[REDACTED]");
    expect(loggedContext.normalField).toBe("public-val");
    consoleSpy.mockRestore();
  });
});
