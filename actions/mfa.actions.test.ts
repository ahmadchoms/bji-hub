import { describe, it, expect, vi, beforeEach } from "vitest";
import { enrollMfaAction, verifyMfaAction } from "./mfa.actions";

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
  requireRole: vi.fn(),
}));

import { getSession, requireRole } from "@/lib/auth/session";

describe("Admin MFA Actions (E4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects non-admin users for verifyMfaAction", async () => {
    vi.mocked(getSession).mockResolvedValue({
      role: "buyer",
      userId: "buyer-1",
      sellerId: null,
    });

    const res = await verifyMfaAction("123456");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("Akses tidak diizinkan");
    }
  });

  it("validates 6-digit code format", async () => {
    vi.mocked(getSession).mockResolvedValue({
      role: "admin",
      userId: "admin-1",
      sellerId: null,
    });

    const invalidRes = await verifyMfaAction("123a");
    expect(invalidRes.success).toBe(false);
    if (!invalidRes.success) {
      expect(invalidRes.error).toContain("6 digit angka");
    }
  });

  it("allows admin to enroll and verify in mock mode", async () => {
    vi.mocked(requireRole).mockResolvedValue({
      role: "admin",
      userId: "admin-1",
      sellerId: null,
    });
    vi.mocked(getSession).mockResolvedValue({
      role: "admin",
      userId: "admin-1",
      sellerId: null,
    });

    const enroll = await enrollMfaAction();
    expect(enroll.success).toBe(true);
    if (enroll.success) {
      expect(enroll.data.qrCode).toBeDefined();
      expect(enroll.data.secret).toBeDefined();
    }

    // Verify with mock code
    const verifySuccess = await verifyMfaAction("123456");
    expect(verifySuccess.success).toBe(true);

    const verifyFail = await verifyMfaAction("654321");
    expect(verifyFail.success).toBe(false);
  });
});
