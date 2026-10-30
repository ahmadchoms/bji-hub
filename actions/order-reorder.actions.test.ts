import { describe, it, expect, vi, beforeEach } from "vitest";
import { reorderCompletedItemAction } from "./order-reorder.actions";

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/data/orders", () => ({
  getOrderById: vi.fn(),
}));

vi.mock("@/lib/data", () => ({
  getListingById: vi.fn(),
}));

import { getSession } from "@/lib/auth/session";
import { getOrderById } from "@/lib/data/orders";
import { getListingById } from "@/lib/data";

describe("reorderCompletedItemAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects guest users", async () => {
    vi.mocked(getSession).mockResolvedValue({
      role: "guest",
      sellerId: null,
      userId: null,
    });

    const res = await reorderCompletedItemAction("ord-1");
    expect(res.success).toBe(false);
  });

  it("enforces order ownership", async () => {
    vi.mocked(getSession).mockResolvedValue({
      role: "buyer",
      sellerId: null,
      userId: "buyer-original",
    });

    vi.mocked(getOrderById).mockResolvedValue({
      id: "ord-1",
      buyerId: "buyer-different",
      listingId: "list-1",
    } as any);

    const res = await reorderCompletedItemAction("ord-1");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("Akses ditolak");
    }
  });

  it("prepares reorder with same grind size and available stock", async () => {
    vi.mocked(getSession).mockResolvedValue({
      role: "buyer",
      sellerId: null,
      userId: "buyer-owner",
    });

    vi.mocked(getOrderById).mockResolvedValue({
      id: "ord-1",
      buyerId: "buyer-owner",
      status: "completed",
      items: [
        {
          listingId: "list-1",
          quantity: 2,
          unitPrice: 110000,
          grindSize: "Medium Fine (V60)",
        },
      ],
    } as any);

    vi.mocked(getListingById).mockResolvedValue({
      id: "list-1",
      slug: "gayo-filter",
      title: "Gayo Filter 250g",
      price: 110000,
      stock: 5,
      status: "active",
      minOrderQty: 1,
      unit: "250g",
    } as any);

    const res = await reorderCompletedItemAction("ord-1", "list-1");
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.listingSlug).toBe("gayo-filter");
      expect(res.data.grindSize).toBe("Medium Fine (V60)");
    }
  });

  it("rejects orders that are not in completed status", async () => {
    vi.mocked(getSession).mockResolvedValue({
      role: "buyer",
      sellerId: null,
      userId: "buyer-owner",
    });

    vi.mocked(getOrderById).mockResolvedValue({
      id: "ord-1",
      buyerId: "buyer-owner",
      status: "shipped",
      items: [],
    } as any);

    const res = await reorderCompletedItemAction("ord-1");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("telah selesai");
    }
  });
});
