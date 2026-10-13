import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendOrderPaidEmail, sendOrderShippedEmail } from "./email";
import type { Order } from "@/types";

const mockOrder: Order = {
  id: "ord-1",
  orderNumber: "ORD-TEST-001",
  buyerId: "user-1",
  buyerName: "Ahmad Buyer",
  buyerEmail: "ahmad@example.com",
  buyerPhone: "08123456789",
  buyerAddress: "Jl. Braga No. 10",
  buyerCity: "Bandung",
  sellerId: "seller-1",
  sellerName: "Preanger Roastery",
  listingId: "listing-1",
  listingTitle: "Arabika Puntang",
  quantity: 2,
  itemPrice: 100000,
  subtotal: 200000,
  shippingCost: 15000,
  serviceFee: 1000,
  totalAmount: 216000,
  shippingCourier: "JNE",
  trackingNumber: "JNE999111000",
  status: "paid",
  createdAt: "2026-10-14T00:00:00.000Z",
  updatedAt: "2026-10-14T00:00:00.000Z",
};

describe("Transactional Email Handler", () => {
  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
  });

  it("handles mock email when RESEND_API_KEY is not defined", async () => {
    const result = await sendOrderPaidEmail(mockOrder);
    expect(result.success).toBe(true);
    expect(result.mocked).toBe(true);
  });

  it("handles shipped email mock when RESEND_API_KEY is not defined", async () => {
    const result = await sendOrderShippedEmail(mockOrder);
    expect(result.success).toBe(true);
    expect(result.mocked).toBe(true);
  });

  it("gracefully handles orders with missing buyerEmail", async () => {
    const orderNoEmail = { ...mockOrder, buyerEmail: "" };
    const result = await sendOrderPaidEmail(orderNoEmail);
    expect(result.success).toBe(true);
    expect(result.mocked).toBe(true);
  });
});
