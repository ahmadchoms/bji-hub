import { describe, expect, it, vi, beforeEach } from "vitest";

process.env.DATA_SOURCE = "mock";

import { mockProvider } from "@/lib/payments/mock-provider";
import { midtransProvider } from "@/lib/payments/midtrans-provider";
import * as midtransModule from "@/lib/midtrans";
import {
  createRefundRecord,
  getRefundByOrderId,
  updateRefundStatus,
  getPendingOrFailedRefunds,
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

    it("updates refund status and increments attempts (N1 Outbox)", async () => {
      const record = await createRefundRecord({
        id: "ref-deterministic-1",
        orderId: "ord-outbox-789",
        amount: 120000,
        reason: "Batal beli",
        status: "pending",
        createdBy: "buyer-1",
      });

      expect(record.status).toBe("pending");
      expect(record.attempts).toBe(0);

      const updated = await updateRefundStatus(record.id, {
        status: "processed",
        providerRef: "charge-outbox-success",
        attempts: 1,
      });

      expect(updated?.status).toBe("processed");
      expect(updated?.providerRef).toBe("charge-outbox-success");
      expect(updated?.attempts).toBe(1);
    });

    it("retrieves pending and failed refunds under max attempts for cron retry (N1)", async () => {
      await createRefundRecord({
        id: "ref-pending-1",
        orderId: "ord-p-1",
        amount: 50000,
        reason: "Test 1",
        status: "pending",
        attempts: 0,
      });

      await createRefundRecord({
        id: "ref-failed-1",
        orderId: "ord-f-1",
        amount: 60000,
        reason: "Test 2",
        status: "failed",
        attempts: 2,
      });

      await createRefundRecord({
        id: "ref-processed-1",
        orderId: "ord-pr-1",
        amount: 70000,
        reason: "Test 3",
        status: "processed",
        attempts: 1,
      });

      await createRefundRecord({
        id: "ref-maxed-1",
        orderId: "ord-m-1",
        amount: 80000,
        reason: "Test 4",
        status: "failed",
        attempts: 5, // already at max attempts
      });

      const retryQueue = await getPendingOrFailedRefunds(5);
      const ids = retryQueue.map((r) => r.id);

      expect(ids).toContain("ref-pending-1");
      expect(ids).toContain("ref-failed-1");
      expect(ids).not.toContain("ref-processed-1");
      expect(ids).not.toContain("ref-maxed-1");
    });
  });

  describe("Deterministic refundKey in MidtransProvider (N1)", () => {
    it("forwards custom deterministic refundKey to requestMidtransRefund", async () => {
      const spy = vi.spyOn(midtransModule, "requestMidtransRefund").mockResolvedValueOnce({
        statusCode: "200",
        statusMessage: "Success",
        refundChargeId: "charge-key-test",
      });

      await midtransProvider.refund("ORD-KEY-TEST", 50000, "Alasan", {
        refundKey: "refund-deterministic-uuid",
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: "ORD-KEY-TEST",
          amount: 50000,
          reason: "Alasan",
          refundKey: "refund-deterministic-uuid",
        }),
      );
    });
  });

  describe("cancelOrderWithRefund and orphan void guard (M1)", () => {
    it("atomically cancels order and creates refund record in mock mode", async () => {
      const { cancelOrderWithRefund, mockOrders } = await import("@/lib/data/orders");
      const orderId = "ORD-ATOMIC-REFUND-1";
      mockOrders.push({
        id: orderId,
        orderNumber: orderId,
        buyerId: "user-buyer-1",
        sellerId: "seller-1",
        listingId: "listing-1",
        listingTitle: "Kopi Gayo",
        listingSlug: "kopi-gayo",
        sellerName: "Toko Gayo",
        quantity: 2,
        totalAmount: 180000,
        itemPrice: 80000,
        shippingCost: 20000,
        buyerName: "Buyer Test",
        buyerEmail: "test@example.com",
        buyerPhone: "081234",
        buyerAddress: "Jl. Test",
        buyerCity: "Jakarta",
        buyerPostalCode: "12345",
        status: "paid",
        midtransOrderId: orderId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const res = await cancelOrderWithRefund(orderId, {
        reason: "Batal sebelum kirim",
        createdBy: "user-buyer-1",
      });

      expect(res.applied).toBe(true);
      expect(res.order?.status).toBe("canceled");
      expect(res.refundRecord).toBeDefined();
      expect(res.refundRecord?.orderId).toBe(orderId);
      expect(res.refundRecord?.status).toBe("pending");
      expect(res.refundRecord?.amount).toBe(180000);
    });

    it("rejects cancelOrderWithRefund when order is in shipped or completed status", async () => {
      const { cancelOrderWithRefund, mockOrders } = await import("@/lib/data/orders");
      const orderId = "ORD-SHIPPED-NO-CANCEL";
      mockOrders.push({
        id: orderId,
        orderNumber: orderId,
        buyerId: "user-buyer-1",
        sellerId: "seller-1",
        listingId: "listing-1",
        listingTitle: "Kopi Gayo",
        listingSlug: "kopi-gayo",
        sellerName: "Toko Gayo",
        quantity: 1,
        totalAmount: 100000,
        itemPrice: 80000,
        shippingCost: 20000,
        buyerName: "Buyer Test",
        buyerEmail: "test@example.com",
        buyerPhone: "081234",
        buyerAddress: "Jl. Test",
        buyerCity: "Jakarta",
        buyerPostalCode: "12345",
        status: "shipped",
        midtransOrderId: orderId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const res = await cancelOrderWithRefund(orderId, {
        reason: "Batal tapi barang sudah jalan",
        createdBy: "user-buyer-1",
      });

      expect(res.applied).toBe(false);
      expect(res.order?.status).toBe("shipped");
      expect(res.refundRecord).toBeNull();
      expect(res.error).toContain("tidak dapat dibatalkan");
    });
  });
});
