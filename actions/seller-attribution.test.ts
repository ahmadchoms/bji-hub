process.env.DATA_SOURCE = "mock";

import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveListingAction } from "./seller.actions";
import {
  mockProducerSellers,
  approveProducerAttribution,
} from "@/lib/data/producers";

let currentSeller = {
  userId: "user-seller-6",
  sellerId: "seller-6",
  role: "seller" as const,
};

vi.mock("@/lib/auth/session", () => ({
  requireSeller: vi.fn().mockImplementation(() => Promise.resolve(currentSeller)),
  requireRole: vi.fn().mockResolvedValue({ userId: "admin-1", role: "admin" }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/cache/revalidate", () => ({
  revalidateListing: vi.fn(),
  revalidateStore: vi.fn(),
}));

vi.mock("@/lib/data/audit-logs", () => ({
  recordAuditLog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/data")>();
  return {
    ...actual,
    createListing: vi.fn().mockResolvedValue({ id: "list-new-1", slug: "kopi-gayo" }),
    getSellerPlanState: vi.fn().mockResolvedValue({ tier: "business" }),
  };
});

vi.mock("@/lib/after", () => ({
  runAfterResponse: vi.fn((fn) => fn()),
}));

describe("A5: Producer-Seller Attribution & Lot Code Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSeller = {
      userId: "user-seller-6",
      sellerId: "seller-6",
      role: "seller",
    };
  });

  const validListingData = {
    title: "Kopi Arabika Gayo Organik Premium",
    categoryId: "cat-2",
    description: "Kopi arabika single origin premium dengan cita rasa kompleks dan bersih.",
    price: 95000,
    unit: "250g",
    minOrderQty: 1,
    stock: 50,
    status: "active" as const,
    roastDate: "2026-10-25",
    images: [{ url: "/api/mock-storage/coffee1.jpg", path: "coffee1.jpg" }],
  };

  it("fails saveListingAction when producerId is not approved for seller", async () => {
    const res = await saveListingAction({
      ...validListingData,
      producerId: "prod-unapproved-999",
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("Produser belum disetujui untuk toko Anda");
    }
  });

  it("succeeds saveListingAction when producerId is approved for seller", async () => {
    // Approve prod-test-approved for seller-6
    await approveProducerAttribution("prod-test-approved", "seller-6", "admin-1");

    const res = await saveListingAction({
      ...validListingData,
      producerId: "prod-test-approved",
    });

    expect(res.success).toBe(true);
  });

  it("authz: seller B cannot use producer approved only for seller A", async () => {
    // Approve for seller-6 only
    await approveProducerAttribution("prod-exclusive-a", "seller-6", "admin-1");

    // Switch session to seller-2
    currentSeller = {
      userId: "user-seller-2",
      sellerId: "seller-2",
      role: "seller",
    };

    const res = await saveListingAction({
      ...validListingData,
      producerId: "prod-exclusive-a",
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("Produser belum disetujui untuk toko Anda");
    }
  });

  it("rejects duplicate lot code for the same seller", async () => {
    // Mock isLotCodeUsedBySeller to simulate duplicate detection
    const producersModule = await import("@/lib/data/producers");
    const spy = vi.spyOn(producersModule, "isLotCodeUsedBySeller").mockResolvedValueOnce(true);

    const res = await saveListingAction({
      ...validListingData,
      producerId: "prod-test-approved",
      lotCode: "LOT-DUPLICATE-001",
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("sudah digunakan pada produk Anda yang lain");
    }

    spy.mockRestore();
  });
});
