import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isAdminAllowed, isAdminMfaSatisfied, hasAdminRole } from "./admin-guard";
import type { Session } from "@/lib/auth/roles";
import { asUserId } from "@/types/ids";

describe("lib/auth/admin-guard.ts - Admin MFA Enforcement (H2)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns false for null or undefined sessions", async () => {
    expect(await isAdminAllowed(null)).toBe(false);
    expect(await isAdminAllowed(undefined)).toBe(false);
  });

  it("returns false for non-admin roles", async () => {
    const buyerSession: Session = { role: "buyer", sellerId: null, userId: asUserId("u-1") };
    const sellerSession: Session = { role: "seller", sellerId: null, userId: asUserId("u-2") };
    expect(await isAdminAllowed(buyerSession)).toBe(false);
    expect(await isAdminAllowed(sellerSession)).toBe(false);
  });

  it("identifies admin role correctly with hasAdminRole", () => {
    expect(hasAdminRole({ role: "admin", sellerId: null })).toBe(true);
    expect(hasAdminRole({ role: "seller", sellerId: null })).toBe(false);
    expect(hasAdminRole(null)).toBe(false);
  });

  it("allows admin in test / mock environment", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    vi.stubEnv("NODE_ENV", "test");
    const adminSession: Session = { role: "admin", sellerId: null, userId: asUserId("u-admin") };
    expect(await isAdminAllowed(adminSession)).toBe(true);
    vi.unstubAllEnvs();
  });

  it("allows admin when ADMIN_MFA_REQUIRED is explicitly set to false", async () => {
    process.env.ADMIN_MFA_REQUIRED = "false";
    expect(await isAdminMfaSatisfied()).toBe(true);
  });
});
