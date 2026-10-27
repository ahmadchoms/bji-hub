import { describe, expect, it, vi, beforeEach } from "vitest";
import { mockProvider } from "@/lib/payments/mock-provider";
import { midtransProvider } from "@/lib/payments/midtrans-provider";
import * as midtransModule from "@/lib/midtrans";
import {
  createRefundRecord,
  getRefundByOrderId,
  _resetMockRefundsForTest,
} from "./refunds";

describe("Refund System (B6)", () => {
  beforeEach(() => {
    _resetMockRefundsForTest();
    vi.restoreAllMocks();
  });

  describe("MockProvider refund", () => {
    it("returns processed status with provider reference", async () => {
      const result = await mockProvider.refund("ORD-123", 150000, "Pembeli membatalkan pesanan");
      expect(result.success).toBe(true);
      expect(result.status).toBe("processed");
      expect(result.providerRef).toMatch(/^ref-mock-/);
      expect(result.message).toContain("150.000");
    });
  });

  describe("MidtransProvider refund", () => {
    it("returns processed when Midtrans API responds with 200", async () => {
      vi.spyOn(midtransModule, "requestMidtransRefund").mockResolvedValueOnce({
        statusCode: "200",
        statusMessage: "Success, refund request is approved",
        refundChargeId: "charge-ref-999",
      });

      const res = await midtransProvider.refund("ORD-MIDTRANS-1", 200000, "Salah pesan");
      expect(res.success).toBe(true);
      expect(res.status).toBe("processed");
      expect(res.providerRef).toBe("charge-ref-999");
    });

    it("returns manual_required when Midtrans API responds with 412 (e.g. Bank Transfer)", async () => {
      vi.spyOn(midtransModule, "requestMidtransRefund").mockResolvedValueOnce({
        statusCode: "412",
        statusMessage: "Merchant cannot perform direct refund for this payment type",
      });

      const res = await midtransProvider.refund("ORD-MIDTRANS-VA", 300000, "Batal");
      expect(res.success).toBe(false);
      expect(res.status).toBe("manual_required");
      expect(res.message).toContain("manual");
    });

    it("returns failed when Midtrans API call fails or network error occurs", async () => {
      vi.spyOn(midtransModule, "requestMidtransRefund").mockResolvedValueOnce(null);

      const res = await midtransProvider.refund("ORD-MIDTRANS-FAIL", 100000, "Error");
      expect(res.success).toBe(false);
      expect(res.status).toBe("failed");
      expect(res.message).toContain("Gagal menghubungi gateway");
    });
  });

  describe("Refund Data Layer", () => {
    it("creates and retrieves a refund record", async () => {
      const record = await createRefundRecord({
        orderId: "ord-test-456",
        amount: 250000,
        reason: "Stok roastery habis",
        status: "processed",
        providerRef: "ref-midtrans-abc",
        createdBy: "seller-123",
      });

      expect(record.id).toMatch(/^ref-/);
      expect(record.orderId).toBe("ord-test-456");
      expect(record.amount).toBe(250000);
      expect(record.status).toBe("processed");

      const fetched = await getRefundByOrderId("ord-test-456");
      expect(fetched).not.toBeNull();
      expect(fetched?.id).toBe(record.id);
      expect(fetched?.reason).toBe("Stok roastery habis");
    });
  });
});
