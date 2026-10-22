import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";
import { isMockAuthAllowed, MOCK_SESSION_COOKIE } from "./mock-guard";

describe("isMockAuthAllowed", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("exports the correct mock session cookie name", () => {
    expect(MOCK_SESSION_COOKIE).toBe("biji-mock-session");
  });

  it("returns false in production with prisma", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATA_SOURCE", "prisma");
    vi.stubEnv("ALLOW_MOCK_AUTH", "false");
    expect(isMockAuthAllowed()).toBe(false);
  });

  it("returns false in production with mock when ALLOW_MOCK_AUTH is not true", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATA_SOURCE", "mock");
    vi.stubEnv("ALLOW_MOCK_AUTH", "false");
    expect(isMockAuthAllowed()).toBe(false);
  });

  it("returns true in production with mock when ALLOW_MOCK_AUTH is explicitly true", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATA_SOURCE", "mock");
    vi.stubEnv("ALLOW_MOCK_AUTH", "true");
    expect(isMockAuthAllowed()).toBe(true);
  });

  it("returns true in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DATA_SOURCE", "prisma");
    expect(isMockAuthAllowed()).toBe(true);
  });

  it("returns true in test", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("DATA_SOURCE", "prisma");
    expect(isMockAuthAllowed()).toBe(true);
  });
});
