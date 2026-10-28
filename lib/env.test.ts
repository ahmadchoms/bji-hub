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

  it("throws in production with prisma when SUPABASE_SERVICE_ROLE_KEY or CRON_SECRET is missing (S7)", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATA_SOURCE", "prisma");
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@localhost:5432/db");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("MIDTRANS_SERVER_KEY", "server-key");
    vi.stubEnv("MIDTRANS_CLIENT_KEY", "client-key");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://bji-hub.vercel.app");
    vi.stubEnv("RESEND_API_KEY", "re_123");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", ""); // Missing
    vi.stubEnv("CRON_SECRET", ""); // Missing

    expect(() => validateEnv()).toThrow(/SUPABASE_SERVICE_ROLE_KEY wajib diisi/);
  });

  it("throws in production with prisma when RESEND_API_KEY is missing and EMAIL_MODE is not disabled (S7)", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATA_SOURCE", "prisma");
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@localhost:5432/db");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
    vi.stubEnv("CRON_SECRET", "cron-secret");
    vi.stubEnv("MIDTRANS_SERVER_KEY", "server-key");
    vi.stubEnv("MIDTRANS_CLIENT_KEY", "client-key");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://bji-hub.vercel.app");
    vi.stubEnv("RESEND_API_KEY", ""); // Missing
    vi.stubEnv("EMAIL_MODE", "enabled");

    expect(() => validateEnv()).toThrow(/RESEND_API_KEY wajib diisi di production/);
  });

  it("passes in production when EMAIL_MODE=disabled even if RESEND_API_KEY is omitted (S7)", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATA_SOURCE", "prisma");
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@localhost:5432/db");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
    vi.stubEnv("CRON_SECRET", "cron-secret");
    vi.stubEnv("MIDTRANS_SERVER_KEY", "server-key");
    vi.stubEnv("MIDTRANS_CLIENT_KEY", "client-key");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://bji-hub.vercel.app");
    vi.stubEnv("EMAIL_MODE", "disabled");
    vi.stubEnv("RESEND_API_KEY", "");

    expect(() => validateEnv()).not.toThrow();
  });

  it("passes in production with prisma when all required env vars are present", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATA_SOURCE", "prisma");
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@localhost:5432/db");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("MIDTRANS_SERVER_KEY", "server-key");
    vi.stubEnv("MIDTRANS_CLIENT_KEY", "client-key");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://bji-hub.vercel.app");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "test-client-id.apps.googleusercontent.com");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-secret");
    vi.stubEnv("CRON_SECRET", "cron-secret");
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("MIDTRANS_IS_PRODUCTION", "false");

    expect(() => validateEnv()).not.toThrow();
  });
});
