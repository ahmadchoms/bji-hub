import { describe, it, expect, beforeEach } from "vitest";

process.env.DATA_SOURCE = "mock";

import {
  validateVoucher,
  createVoucher,
  toggleVoucherActive,
  getVouchersBySeller,
  mockVouchers,
  mockVoucherRedemptions,
} from "./vouchers";

describe("lib/data/vouchers (C1)", () => {
  beforeEach(() => {
    // Reset mock data to base state
    mockVouchers.length = 0;
    mockVouchers.push(
      {
        id: "v-test-platform",
        code: "TESTPLATFORM10",
        sellerId: null,
        type: "percent",
        value: 10,
        minSubtotal: 50000,
        maxDiscount: 20000,
        startsAt: "2026-01-01T00:00:00.000Z",
        endsAt: "2027-12-31T23:59:59.000Z",
        usageLimit: 10,
        perUserLimit: 1,
        usedCount: 0,
        active: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "v-test-seller",
        code: "SELLERSTORE5K",
        sellerId: "seller-123",
        type: "fixed",
        value: 5000,
        minSubtotal: 30000,
        maxDiscount: null,
        startsAt: "2026-01-01T00:00:00.000Z",
        endsAt: "2027-12-31T23:59:59.000Z",
        usageLimit: 5,
        perUserLimit: 2,
        usedCount: 0,
        active: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    );
    mockVoucherRedemptions.length = 0;
  });

  it("validates a platform percent voucher successfully", async () => {
    const res = await validateVoucher({
      code: "TESTPLATFORM10",
      subtotal: 100000,
      shippingCost: 15000,
      userKey: "user-1",
    });

    expect(res.valid).toBe(true);
    expect(res.discountAmount).toBe(10000); // 10% of 100,000
    expect(res.discountFundedBy).toBe("platform");
  });

  it("validates a seller-specific voucher and rejects when seller mismatch", async () => {
    const wrongSeller = await validateVoucher({
      code: "SELLERSTORE5K",
      subtotal: 50000,
      shippingCost: 10000,
      sellerId: "seller-999",
      userKey: "user-1",
    });
    expect(wrongSeller.valid).toBe(false);
    expect(wrongSeller.reason).toContain("hanya berlaku untuk toko tertentu");

    const rightSeller = await validateVoucher({
      code: "SELLERSTORE5K",
      subtotal: 50000,
      shippingCost: 10000,
      sellerId: "seller-123",
      userKey: "user-1",
    });
    expect(rightSeller.valid).toBe(true);
    expect(rightSeller.discountAmount).toBe(5000);
    expect(rightSeller.discountFundedBy).toBe("seller");
  });

  it("rejects when subtotal is below minimum required subtotal", async () => {
    const res = await validateVoucher({
      code: "TESTPLATFORM10",
      subtotal: 40000, // min is 50,000
      shippingCost: 15000,
      userKey: "user-1",
    });
    expect(res.valid).toBe(false);
    expect(res.reason).toContain("Minimal belanja");
  });

  it("rejects when voucher is inactive or deactivated", async () => {
    await toggleVoucherActive("v-test-platform", false);

    const res = await validateVoucher({
      code: "TESTPLATFORM10",
      subtotal: 100000,
      shippingCost: 15000,
      userKey: "user-1",
    });
    expect(res.valid).toBe(false);
    expect(res.reason).toContain("tidak aktif");
  });

  it("rejects when global usage limit is reached", async () => {
    const v = mockVouchers.find((it) => it.id === "v-test-platform")!;
    v.usedCount = 10; // limit is 10

    const res = await validateVoucher({
      code: "TESTPLATFORM10",
      subtotal: 100000,
      shippingCost: 15000,
      userKey: "user-1",
    });
    expect(res.valid).toBe(false);
    expect(res.reason).toContain("Kuota penggunaan voucher telah habis");
  });

  it("rejects when per-user usage limit is reached", async () => {
    // Record 1 redemption for user-1 (limit is 1 for TESTPLATFORM10)
    mockVoucherRedemptions.push({
      id: "vr-1",
      voucherId: "v-test-platform",
      userKey: "user-1",
      orderId: "ord-1",
      amount: 10000,
      releasedAt: null,
      createdAt: new Date().toISOString(),
    });

    const res = await validateVoucher({
      code: "TESTPLATFORM10",
      subtotal: 100000,
      shippingCost: 15000,
      userKey: "user-1",
    });
    expect(res.valid).toBe(false);
    expect(res.reason).toContain("Batas penggunaan voucher untuk akun Anda telah tercapai");

    // But another user can still use it
    const resUser2 = await validateVoucher({
      code: "TESTPLATFORM10",
      subtotal: 100000,
      shippingCost: 15000,
      userKey: "user-2",
    });
    expect(resUser2.valid).toBe(true);
  });

  it("creates a new voucher with normalized uppercase code and retrieves by seller", async () => {
    const created = await createVoucher({
      code: "kopihemat20",
      sellerId: "seller-123",
      type: "percent",
      value: 20,
      minSubtotal: 40000,
      maxDiscount: 15000,
      startsAt: "2026-01-01T00:00:00.000Z",
      endsAt: "2027-12-31T23:59:59.000Z",
      usageLimit: 50,
      perUserLimit: 1,
    });

    expect(created.code).toBe("KOPIHEMAT20");
    expect(created.sellerId).toBe("seller-123");

    const sellerVouchers = await getVouchersBySeller("seller-123");
    expect(sellerVouchers.some((v) => v.code === "KOPIHEMAT20")).toBe(true);
  });
});
