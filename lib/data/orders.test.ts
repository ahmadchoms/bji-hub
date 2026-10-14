import { describe, it, expect } from "vitest";

process.env.DATA_SOURCE = "mock";

import {
  createOrder,
  getOrderById,
  updateOrderStatus,
  autoCompleteExpiredShippedOrders,
} from "@/lib/data/orders";

describe("orders data layer & auto-complete", () => {
  it("stores and updates order with dispute evidence", async () => {
    const orderNumber = `ORD-TEST-${Date.now()}`;
    const order = await createOrder({
      orderNumber,
      buyerName: "Tester",
      buyerEmail: "test@example.com",
      buyerPhone: "08123456789",
      buyerAddress: "Jl Kopi No 1",
      buyerCity: "Bandung",
      sellerId: "seller-1",
      listingId: "list-1",
      quantity: 2,
      itemPrice: 100000,
      subtotal: 200000,
      shippingCost: 15000,
      serviceFee: 1500,
      totalAmount: 216500,
      shippingCourier: "JNE",
      midtransOrderId: orderNumber,
    });

    expect(order.orderNumber).toBe(orderNumber);
    expect(order.status).toBe("pending_payment");

    // Transition to shipped
    await updateOrderStatus(order.id, "shipped", "JNE123456");
    let updated = await getOrderById(order.id);
    expect(updated?.status).toBe("shipped");
    expect(updated?.trackingNumber).toBe("JNE123456");

    // Transition to disputed with evidence
    await updateOrderStatus(
      order.id,
      "disputed",
      undefined,
      "Kemasan bocor",
      "https://example.com/evidence.jpg",
    );
    updated = await getOrderById(order.id);
    expect(updated?.status).toBe("disputed");
    expect(updated?.disputeReason).toBe("Kemasan bocor");
    expect(updated?.disputeEvidenceUrl).toBe("https://example.com/evidence.jpg");
  });

  it("auto-completes orders shipped more than 7 days ago", async () => {
    const orderNumber = `ORD-OLD-${Date.now()}`;
    const order = await createOrder({
      orderNumber,
      buyerName: "Old Buyer",
      buyerEmail: "old@example.com",
      buyerPhone: "08987654321",
      buyerAddress: "Jl Lama No 9",
      buyerCity: "Jakarta",
      sellerId: "seller-2",
      listingId: "list-2",
      quantity: 1,
      itemPrice: 50000,
      subtotal: 50000,
      shippingCost: 10000,
      serviceFee: 1500,
      totalAmount: 61500,
      shippingCourier: "SiCepat",
      midtransOrderId: orderNumber,
    });

    // Mark as shipped with old date (8 days ago)
    await updateOrderStatus(order.id, "shipped", "EXP888");
    const fetched = await getOrderById(order.id);
    if (fetched) {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      fetched.updatedAt = threeDaysAgo;
    }

    const result = await autoCompleteExpiredShippedOrders(); // uses default 2 days
    expect(result.completedCount).toBeGreaterThanOrEqual(1);
    expect(result.orderIds).toContain(order.id);

    const after = await getOrderById(order.id);
    expect(after?.status).toBe("completed");
  });

  it("decrements listing stock when order status transitions to paid", async () => {
    const { mockListings } = await import("@/lib/mock/data");
    const listing = mockListings[0];
    listing.stock = 20;

    const orderNumber = `ORD-STOCK-${Date.now()}`;
    const order = await createOrder({
      orderNumber,
      buyerName: "Stock Buyer",
      buyerEmail: "stock@example.com",
      buyerPhone: "08123456780",
      buyerAddress: "Jl Kopi No 10",
      buyerCity: "Bandung",
      sellerId: listing.sellerId,
      listingId: listing.id,
      quantity: 5,
      itemPrice: 100000,
      subtotal: 500000,
      shippingCost: 15000,
      serviceFee: 1500,
      totalAmount: 516500,
      shippingCourier: "JNE",
      midtransOrderId: orderNumber,
    });

    expect(listing.stock).toBe(20);

    // Transition to paid
    await updateOrderStatus(order.id, "paid");
    expect(listing.stock).toBe(15);
  });
});
