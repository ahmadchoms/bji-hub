import { describe, it, expect, vi } from "vitest";

process.env.DATA_SOURCE = "mock";

let currentRole = "seller";
let currentSellerId: string | null = "seller-kyc-test";
let currentUserId = "user-seller-kyc";

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(async () => ({
    userId: currentUserId,
    sellerId: currentSellerId,
    role: currentRole,
  })),
  requireSeller: vi.fn(async () => ({
    userId: currentUserId,
    sellerId: currentSellerId!,
    role: "seller",
  })),
  requireRole: vi.fn(async () => ({
    userId: currentUserId,
    sellerId: currentSellerId,
    role: currentRole,
  })),
}));

vi.mock("@/lib/data", async () => {
  const actual = await import("@/lib/mock/repository");
  return {
    ...actual,
    getSellerById: vi.fn(async (id: string) => {
      if (id === "seller-kyc-test") {
        return {
          id: "seller-kyc-test",
          businessName: "Kopi KYC Test",
          kycDocumentUrl: "seller-kyc/uploads/seller-kyc-test/doc123.pdf",
        };
      }
      return null;
    }),
  };
});

import {
  createKycUploadTargetAction,
  getKycDocumentSignedUrlAction,
} from "./upload.actions";

describe("upload.actions KYC private bucket and short-lived signed URLs (F10/S6)", () => {
  it("rejects non-sellers from requesting KYC upload target", async () => {
    currentRole = "buyer";
    currentSellerId = null;

    const res = await createKycUploadTargetAction({
      filename: "ktp.jpg",
      contentType: "image/jpeg",
      size: 1024 * 500,
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("Hanya akun penjual");
    }
  });

  it("creates a private upload target for seller with valid document", async () => {
    currentRole = "seller";
    currentSellerId = "seller-kyc-test";

    const res = await createKycUploadTargetAction({
      filename: "ktp.pdf",
      contentType: "application/pdf",
      size: 2 * 1024 * 1024,
    });

    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.path).toContain("seller-kyc/uploads/seller-kyc-test/");
    expect(res.data.uploadUrl).toBeDefined();
  });

  it("rejects invalid document format for KYC upload", async () => {
    currentRole = "seller";
    currentSellerId = "seller-kyc-test";

    const res = await createKycUploadTargetAction({
      filename: "archive.zip",
      contentType: "application/zip",
      size: 1024,
    });

    expect(res.success).toBe(false);
  });

  it("allows seller to get a signed URL for their own KYC document with 5-minute expiry", async () => {
    currentRole = "seller";
    currentSellerId = "seller-kyc-test";

    const res = await getKycDocumentSignedUrlAction("seller-kyc-test");
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.signedUrl).toContain("seller-kyc");
    // Expiry should be ~300s (5 minutes) from now
    const now = Date.now();
    expect(res.data.expiresAt).toBeGreaterThan(now + 290_000);
    expect(res.data.expiresAt).toBeLessThanOrEqual(now + 301_000);
  });

  it("allows admin to get a signed URL for any seller KYC document", async () => {
    currentRole = "admin";
    currentSellerId = null;

    const res = await getKycDocumentSignedUrlAction("seller-kyc-test");
    expect(res.success).toBe(true);
  });

  it("blocks unauthorized sellers from viewing another seller's KYC document", async () => {
    currentRole = "seller";
    currentSellerId = "other-seller-id";

    const res = await getKycDocumentSignedUrlAction("seller-kyc-test");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("Akses tidak diizinkan");
    }
  });
});
