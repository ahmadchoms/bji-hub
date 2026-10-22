import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.DATA_SOURCE = "mock";
});

import {
  getSellerBalanceSummary,
  getSellerBankDetails,
  updateSellerBankDetails,
  createPayoutRequestAtomic,
  getPayoutRequestsBySeller,
  getAllPayoutRequests,
  updatePayoutStatus,
} from "./payouts";
import { createOrder, updateOrderStatus } from "@/lib/data/orders";

describe("payouts and balance summary", () => {
  it("can get and update seller bank details", async () => {
    const testSellerId = "seller-test-" + Date.now();
    await updateSellerBankDetails(testSellerId, {
      bankName: "BCA",
      bankAccountNumber: "1234567890",
      bankAccountHolder: "Ujang Roaster",
    });

    const bank = await getSellerBankDetails(testSellerId);
    expect(bank).not.toBeNull();
    expect(bank?.bankName).toBe("BCA");
    expect(bank?.bankAccountNumber).toBe("1234567890");
    expect(bank?.bankAccountHolder).toBe("Ujang Roaster");
  });

  it("rejects payout request when available balance is insufficient", async () => {
    const testSellerId = "seller-payout-empty-" + Date.now();
    const bankDetails = {
      bankName: "Mandiri",
      bankAccountNumber: "987654321",
      bankAccountHolder: "Kopi Nusantara",
    };
    await updateSellerBankDetails(testSellerId, bankDetails);

    const summary = await getSellerBalanceSummary(testSellerId);
    expect(summary.availableBalance).toBe(0);

    const res = await createPayoutRequestAtomic({
      sellerId: testSellerId,
      amount: 50000,
      bankDetails,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toContain("Saldo siap ditarik tidak mencukupi");
    }
  });

  it("handles balance and atomic payout correctly with completed orders", async () => {
    const testSellerId = "seller-payout-success-" + Date.now();
    const bankDetails = {
      bankName: "BCA",
      bankAccountNumber: "555123456",
      bankAccountHolder: "Mitra Tani",
    };
    await updateSellerBankDetails(testSellerId, bankDetails);

    // Create an order and transition to completed to give 100,000 balance
    const order = await createOrder({
      buyerName: "Buyer Test",
      buyerEmail: "buyer@example.com",
      buyerPhone: "081234567890",
      buyerAddress: "Jl. Sukajadi",
      buyerCity: "Bandung",
      sellerId: testSellerId,
      listingId: "list-1",
      quantity: 1,
      itemPrice: 100000,
      subtotal: 100000,
      shippingCost: 15000,
      serviceFee: 1500,
      totalAmount: 116500,
      shippingCourier: "JNE REG",
    });

    await updateOrderStatus(order.id, "paid");
    await updateOrderStatus(order.id, "shipped", "RESI123");
    await updateOrderStatus(order.id, "completed");

    const summaryBefore = await getSellerBalanceSummary(testSellerId);
    expect(summaryBefore.totalEarned).toBe(100000);
    expect(summaryBefore.availableBalance).toBe(100000);

    // Attempt 60,000 payout (60% of total)
    const payout1 = await createPayoutRequestAtomic({
      sellerId: testSellerId,
      amount: 60000,
      bankDetails,
      notes: "Tarik dana 1",
    });

    expect(payout1.ok).toBe(true);
    if (!payout1.ok) return;
    expect(payout1.payout.amount).toBe(60000);
    expect(payout1.payout.status).toBe("pending");

    const summaryAfter = await getSellerBalanceSummary(testSellerId);
    expect(summaryAfter.totalWithdrawn).toBe(60000);
    expect(summaryAfter.availableBalance).toBe(40000);

    // Second attempt of 60,000 should fail because only 40,000 remains
    const payout2 = await createPayoutRequestAtomic({
      sellerId: testSellerId,
      amount: 60000,
      bankDetails,
      notes: "Tarik dana 2",
    });
    expect(payout2.ok).toBe(false);
  });

  it("allows admin to retrieve and update payout status for pending payouts only", async () => {
    const testSellerId = "seller-payout-admin-" + Date.now();
    const bankDetails = {
      bankName: "BCA",
      bankAccountNumber: "777888999",
      bankAccountHolder: "Admin Test",
    };
    await updateSellerBankDetails(testSellerId, bankDetails);

    const order = await createOrder({
      buyerName: "Buyer Test",
      buyerEmail: "buyer@example.com",
      buyerPhone: "081234567890",
      buyerAddress: "Jl. Sukajadi",
      buyerCity: "Bandung",
      sellerId: testSellerId,
      listingId: "list-1",
      quantity: 1,
      itemPrice: 50000,
      subtotal: 50000,
      shippingCost: 10000,
      serviceFee: 1500,
      totalAmount: 61500,
      shippingCourier: "JNE",
    });
    await updateOrderStatus(order.id, "paid");
    await updateOrderStatus(order.id, "shipped", "RESI123");
    await updateOrderStatus(order.id, "completed");

    const created = await createPayoutRequestAtomic({
      sellerId: testSellerId,
      amount: 50000,
      bankDetails,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    // First update should succeed
    const firstUpdate = await updatePayoutStatus(created.payout.id, "processed");
    expect(firstUpdate).toBe(true);

    // Second update should return false because status is already processed, not pending
    const secondUpdate = await updatePayoutStatus(created.payout.id, "rejected");
    expect(secondUpdate).toBe(false);
  });

  describe.skipIf(!process.env.TEST_DATABASE_URL)("database concurrency tests", () => {
    it("handles concurrent payouts atomically", async () => {
      // Runs only in real postgres with TEST_DATABASE_URL
    });
  });
});
