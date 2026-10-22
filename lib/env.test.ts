import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { validateEnv } from "./env";

describe("validateEnv", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("passes silently in test environment", () => {
    vi.stubEnv("NODE_ENV", "test");
    expect(() => validateEnv()).not.toThrow();
  });

  it("passes silently in development environment", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(() => validateEnv()).not.toThrow();
  });

  it("throws in production when DATA_SOURCE is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATA_SOURCE", "");
    expect(() => validateEnv()).toThrow(/DATA_SOURCE wajib diisi di production/);
  });

  it("throws in production when DATA_SOURCE is mock but ALLOW_MOCK_AUTH is not true", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATA_SOURCE", "mock");
    vi.stubEnv("ALLOW_MOCK_AUTH", "");
    expect(() => validateEnv()).toThrow(/DATA_SOURCE=mock di production dilarang/);
  });

  it("passes in production when DATA_SOURCE is mock and ALLOW_MOCK_AUTH is true", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATA_SOURCE", "mock");
    vi.stubEnv("ALLOW_MOCK_AUTH", "true");
    expect(() => validateEnv()).not.toThrow();
  });

  it("throws in production with prisma when required env vars are missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATA_SOURCE", "prisma");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");

    expect(() => validateEnv()).toThrow(/CRITICAL: Server configuration error/);
  });
});
