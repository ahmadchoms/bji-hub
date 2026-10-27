import { describe, it, expect, vi, beforeAll } from "vitest";

process.env.DATA_SOURCE = "mock";

let currentSellerId = "seller-cooldown-test";
let currentUserId = "user-seller-1";
let currentEmail = "seller@example.com";

vi.mock("@/lib/auth/session", () => ({
  requireSeller: vi.fn(async () => ({
    userId: currentUserId,
    sellerId: currentSellerId,
    role: "seller",
    email: currentEmail,
  })),
  requireRole: vi.fn(async () => ({
    userId: currentUserId,
    sellerId: currentSellerId,
    role: "seller",
    email: currentEmail,
  })),
  getSession: vi.fn(async () => ({
    userId: currentUserId,
    sellerId: currentSellerId,
    role: "seller",
    email: currentEmail,
    name: "Toko Ujang",
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { updateSellerBankAction, requestPayoutAction } from "./payout.actions";
import { getSellerBankDetails, updateSellerBankDetails } from "@/lib/data/payouts";

describe("payout.actions S9 security cooldown", () => {
  it("records bank update timestamp and triggers cooldown on payout requests within 24 hours", async () => {
    // 1. Update bank details
    const updateRes = await updateSellerBankAction({
      bankName: "BCA",
      bankAccountNumber: "1234567890",
      bankAccountHolder: "Ujang Roaster",
    });

    expect(updateRes.success).toBe(true);

    const bankDetails = await getSellerBankDetails(currentSellerId);
    expect(bankDetails).not.toBeNull();
    expect(bankDetails?.bankUpdatedAt).toBeDefined();

    // 2. Request payout immediately -> should be blocked by 24h cooling-off period
    const payoutRes = await requestPayoutAction({
      amount: 50000,
      notes: "Tarik dana segera",
    });

    expect(payoutRes.success).toBe(false);
    if (!payoutRes.success) {
      expect(payoutRes.error).toContain("penarikan dana dijeda selama 24 jam");
    }
  });

  it("allows payout when bank update was older than 24 hours", async () => {
    // Set bankUpdatedAt to 25 hours ago
    const pastDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    await updateSellerBankDetails(currentSellerId, {
      bankName: "BCA",
      bankAccountNumber: "1234567890",
      bankAccountHolder: "Ujang Roaster",
      bankUpdatedAt: pastDate,
    });

    // In mock data layer, balance might be 0 so payout check proceeds past the cooldown
    const payoutRes = await requestPayoutAction({
      amount: 50000,
    });

    // It should NOT fail with cooldown error (it might fail due to insufficient balance, which proves cooldown passed)
    if (!payoutRes.success) {
      expect(payoutRes.error).not.toContain("penarikan dana dijeda selama 24 jam");
    }
  });
});
