import { describe, it, expect, vi, beforeEach } from "vitest";
import { addRoastBatchAction } from "./seller.actions";

vi.mock("@/lib/auth/session", () => ({
  requireSeller: vi.fn(),
}));

vi.mock("@/lib/data", () => ({
  getListingById: vi.fn(),
  updateSellerProfile: vi.fn(),
  createListing: vi.fn(),
  updateListing: vi.fn(),
  getSellerPayments: vi.fn(),
  getSellerPlanState: vi.fn(),
  getSellerStats: vi.fn(),
  requestVerification: vi.fn(),
  activateBoost: vi.fn(),
}));

vi.mock("@/lib/cache/revalidate", () => ({
  revalidateListing: vi.fn(),
  revalidateStore: vi.fn(),
}));

vi.mock("@/lib/after", () => ({
  runAfterResponse: vi.fn((fn) => fn()),
}));

vi.mock("@/lib/data/audit-logs", () => ({
  recordAuditLog: vi.fn(),
}));

vi.mock("@/lib/coffee/roast-batch", () => ({
  addRoastBatch: vi.fn().mockImplementation((params) =>
    Promise.resolve({
      id: "batch-mock-123",
      listingId: params.listingId,
      roastedOn: params.roastedOn,
      quantityKg: params.quantityKg ?? null,
      notes: params.notes ?? null,
      createdAt: new Date().toISOString(),
    })
  ),
}));

import { requireSeller } from "@/lib/auth/session";
import { getListingById } from "@/lib/data";

describe("addRoastBatchAction (F3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthorized seller attempting to add batch to another seller's listing", async () => {
    vi.mocked(requireSeller).mockResolvedValue({
      sellerId: "seller-attacker",
      userId: "user-attacker",
    } as any);

    vi.mocked(getListingById).mockResolvedValue({
      id: "list-1",
      sellerId: "seller-victim",
      title: "Gayo Honey",
      slug: "gayo-honey",
    } as any);

    const res = await addRoastBatchAction({
      listingId: "list-1",
      roastedOn: "2026-10-30",
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("bukan milik toko Anda");
    }
  });

  it("validates roast date schema and rejects invalid date", async () => {
    vi.mocked(requireSeller).mockResolvedValue({
      sellerId: "seller-1",
      userId: "user-1",
    } as any);

    const res = await addRoastBatchAction({
      listingId: "list-1",
      roastedOn: "invalid-date",
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.fieldErrors?.roastedOn).toBeDefined();
    }
  });

  it("successfully adds roast batch for authorized owner", async () => {
    vi.mocked(requireSeller).mockResolvedValue({
      sellerId: "seller-1",
      userId: "user-1",
    } as any);

    vi.mocked(getListingById).mockResolvedValue({
      id: "list-1",
      sellerId: "seller-1",
      title: "Gayo Honey",
      slug: "gayo-honey",
    } as any);

    const res = await addRoastBatchAction({
      listingId: "list-1",
      roastedOn: "2026-10-30",
      quantityKg: 12.5,
      notes: "First crack pada 9:30, profil sangrai filter",
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.roastDate).toBe("2026-10-30");
      expect(res.data.batchId).toBeDefined();
    }
  });
});
