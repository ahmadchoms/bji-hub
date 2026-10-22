import { describe, it, expect, afterEach } from "vitest";
import { validateEnv } from "./env";

describe("validateEnv", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("passes silently in test environment", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    expect(() => validateEnv()).not.toThrow();
  });

  it("passes when DATA_SOURCE is mock", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.DATA_SOURCE = "mock";
    expect(() => validateEnv()).not.toThrow();
  });

  it("throws in production with prisma when required env vars are missing", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.DATA_SOURCE = "prisma";
    delete process.env.DATABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    expect(() => validateEnv()).toThrow(/CRITICAL: Server configuration error/);
  });
});
