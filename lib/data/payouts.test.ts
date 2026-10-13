import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.DATA_SOURCE = "mock";
});

import {
  getSellerBalanceSummary,
  getSellerBankDetails,
  updateSellerBankDetails,
  createPayoutRequest,
  getPayoutRequestsBySeller,
  getAllPayoutRequests,
  updatePayoutStatus,
} from "./payouts";

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

  it("calculates balance correctly with payout requests", async () => {
    const testSellerId = "seller-payout-test-" + Date.now();
    const bankDetails = {
      bankName: "Mandiri",
      bankAccountNumber: "987654321",
      bankAccountHolder: "Kopi Nusantara",
    };
    await updateSellerBankDetails(testSellerId, bankDetails);

    const initialSummary = await getSellerBalanceSummary(testSellerId);
    expect(initialSummary.availableBalance).toBe(0);

    const payout = await createPayoutRequest({
      sellerId: testSellerId,
      amount: 50000,
      bankDetails,
      notes: "Penarikan uji coba",
    });

    expect(payout.id).toBeDefined();
    expect(payout.amount).toBe(50000);
    expect(payout.status).toBe("pending");

    const history = await getPayoutRequestsBySeller(testSellerId);
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].id).toBe(payout.id);
  });

  it("allows admin to retrieve and update payout status", async () => {
    const all = await getAllPayoutRequests();
    expect(Array.isArray(all)).toBe(true);

    if (all.length > 0) {
      const target = all[0];
      const updated = await updatePayoutStatus(target.id, "processed");
      expect(updated).toBe(true);

      const refreshed = await getAllPayoutRequests();
      const match = refreshed.find((p) => p.id === target.id);
      expect(match?.status).toBe("processed");
    }
  });
});
