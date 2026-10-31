import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAdminRefundsAction,
  retryRefundAction,
  resolveManualRefundAction,
} from "./refund.actions";
import { asUserId } from "@/types/ids";

vi.mock("@/lib/auth/session", () => ({
  requireRole: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/data/refunds", () => ({
  getAllRefunds: vi.fn(),
  updateRefundStatus: vi.fn(),
}));

vi.mock("@/lib/data/orders", () => ({
  getOrderById: vi.fn(),
}));

import { requireRole } from "@/lib/auth/session";
import { getAllRefunds } from "@/lib/data/refunds";
import { getOrderById } from "@/lib/data/orders";

describe("Refund Actions AuthZ Matrix (B2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enforces admin role for all refund actions", async () => {
    vi.mocked(requireRole).mockImplementation(async () => {
      throw new Error("NEXT_REDIRECT: /login");
    });

    await expect(getAdminRefundsAction()).rejects.toThrow("NEXT_REDIRECT");
    await expect(retryRefundAction("ref-1")).rejects.toThrow("NEXT_REDIRECT");
    await expect(
      resolveManualRefundAction("ref-1", "Transfer manual")
    ).rejects.toThrow("NEXT_REDIRECT");
  });

  it("allows admin to fetch refunds list", async () => {
    vi.mocked(requireRole).mockResolvedValue({
      role: "admin",
      userId: asUserId("admin-1"),
      sellerId: null,
    });
    vi.mocked(getAllRefunds).mockResolvedValue([
      {
        id: "ref-1",
        orderId: "ord-1",
        amount: 50000,
        status: "pending",
        reason: "Batal pesanan",
        providerRef: null,
        createdBy: "user-buyer-1",
        attempts: 0,
        failureReason: null,
        resolvedBy: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    const res = await getAdminRefundsAction();
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.length).toBe(1);
      expect(res.data[0].id).toBe("ref-1");
    }
  });

  it("guards against retry when order is not canceled (M1 orphan void guard)", async () => {
    vi.mocked(requireRole).mockResolvedValue({
      role: "admin",
      userId: asUserId("admin-1"),
      sellerId: null,
    });
    vi.mocked(getAllRefunds).mockResolvedValue([
      {
        id: "ref-1",
        orderId: "ord-1",
        amount: 50000,
        status: "pending",
        reason: "Batal",
        providerRef: null,
        createdBy: "user-buyer-1",
        attempts: 0,
        failureReason: null,
        resolvedBy: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    // Order is still 'paid', not 'canceled'
    vi.mocked(getOrderById).mockResolvedValue({
      id: "ord-1",
      orderNumber: "ORD-1",
      sellerId: "seller-1" as any,
      listingId: "list-1",
      buyerName: "Test",
      buyerEmail: "test@example.com",
      buyerPhone: "123",
      buyerAddress: "Jl",
      buyerCity: "Bdg",
      quantity: 1,
      itemPrice: 50000,
      subtotal: 50000,
      shippingCost: 0,
      serviceFee: 0,
      totalAmount: 50000,
      status: "paid",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const res = await retryRefundAction("ref-1");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("bukan dibatalkan");
    }
  });
});
