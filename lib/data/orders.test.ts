import { describe, it, expect } from "vitest";

process.env.DATA_SOURCE = "mock";

import {
  createOrder,
  getOrderById,
  updateOrderStatus,
  transitionOrderStatus,
  autoCompleteExpiredShippedOrders,
  autoCancelExpiredPendingOrders,
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

    // Transition to paid first, then shipped
    const paidRes = await updateOrderStatus(order.id, "paid");
    expect(paidRes).toBe(true);

    const shipRes = await updateOrderStatus(order.id, "shipped", "JNE123456");
    expect(shipRes).toBe(true);
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

    // Mark as paid then shipped with old date
    await updateOrderStatus(order.id, "paid");
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

  it("enforces state machine transition restrictions", async () => {
    const orderNumber = `ORD-RESTRICT-${Date.now()}`;
    const order = await createOrder({
      orderNumber,
      buyerName: "Restrict Buyer",
      buyerEmail: "restrict@example.com",
      buyerPhone: "08123456781",
      buyerAddress: "Jl Aman No 1",
      buyerCity: "Bandung",
      sellerId: "seller-1",
      listingId: "list-1",
      quantity: 1,
      itemPrice: 50000,
      subtotal: 50000,
      shippingCost: 10000,
      serviceFee: 1500,
      totalAmount: 61500,
      shippingCourier: "JNE",
      midtransOrderId: orderNumber,
    });

    // pending_payment -> shipped is rejected
    const r1 = await transitionOrderStatus(order.id, "shipped");
    expect(r1.applied).toBe(false);

    // pending_payment -> paid is accepted
    const r2 = await transitionOrderStatus(order.id, "paid");
    expect(r2.applied).toBe(true);

    // paid -> completed is rejected (must be shipped first)
    const r3 = await transitionOrderStatus(order.id, "completed");
    expect(r3.applied).toBe(false);

    // paid -> canceled is accepted
    const r4 = await transitionOrderStatus(order.id, "canceled");
    expect(r4.applied).toBe(true);

    // canceled -> paid is rejected
    const r5 = await transitionOrderStatus(order.id, "paid");
    expect(r5.applied).toBe(false);
  });

  it("decrements listing stock once on multiple transition calls and restores on cancel", async () => {
    const { mockListings } = await import("@/lib/mock/data");
    const listing = mockListings[0];
    listing.stock = 30;

    const orderNumber = `ORD-MULTI-CALL-${Date.now()}`;
    const order = await createOrder({
      orderNumber,
      buyerName: "Idempotent Buyer",
      buyerEmail: "idem@example.com",
      buyerPhone: "08123456782",
      buyerAddress: "Jl Kopi No 11",
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

    // First paid call: applied and stock decreases
    const call1 = await transitionOrderStatus(order.id, "paid");
    expect(call1.applied).toBe(true);
    expect(listing.stock).toBe(25);

    // Second paid call: idempotent, not applied, stock untouched
    const call2 = await transitionOrderStatus(order.id, "paid");
    expect(call2.applied).toBe(false);
    expect(listing.stock).toBe(25);

    // paid -> canceled restores stock
    const call3 = await transitionOrderStatus(order.id, "canceled");
    expect(call3.applied).toBe(true);
    expect(listing.stock).toBe(30);
  });

  it("pending_payment -> canceled does not change stock", async () => {
    const { mockListings } = await import("@/lib/mock/data");
    const listing = mockListings[0];
    const initialStock = listing.stock ?? 30;

    const orderNumber = `ORD-CANCEL-PENDING-${Date.now()}`;
    const order = await createOrder({
      orderNumber,
      buyerName: "Never Paid Buyer",
      buyerEmail: "never@example.com",
      buyerPhone: "08123456783",
      buyerAddress: "Jl Belum Bayar No 1",
      buyerCity: "Jakarta",
      sellerId: listing.sellerId,
      listingId: listing.id,
      quantity: 3,
      itemPrice: 50000,
      subtotal: 150000,
      shippingCost: 10000,
      serviceFee: 1500,
      totalAmount: 161500,
      shippingCourier: "JNE",
      midtransOrderId: orderNumber,
    });

    expect(listing.stock).toBe(initialStock);

    const cancelRes = await transitionOrderStatus(order.id, "canceled");
    expect(cancelRes.applied).toBe(true);
    expect(listing.stock).toBe(initialStock);
  });

  it("auto-cancels pending orders older than 24 hours", async () => {
    const orderNumber = `ORD-PENDING-OLD-${Date.now()}`;
    const order = await createOrder({
      orderNumber,
      buyerName: "Lazy Buyer",
      buyerEmail: "lazy@example.com",
      buyerPhone: "08123456789",
      buyerAddress: "Jl Pending No 1",
      buyerCity: "Jakarta",
      sellerId: "seller-1",
      listingId: "list-1",
      quantity: 1,
      itemPrice: 50000,
      subtotal: 50000,
      shippingCost: 10000,
      serviceFee: 1500,
      totalAmount: 61500,
      shippingCourier: "JNE",
      midtransOrderId: orderNumber,
    });

    const fetched = await getOrderById(order.id);
    if (fetched) {
      fetched.createdAt = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    }

    const result = await autoCancelExpiredPendingOrders(24);
    expect(result.canceledCount).toBeGreaterThanOrEqual(1);
    expect(result.orderIds).toContain(order.id);

    const after = await getOrderById(order.id);
    expect(after?.status).toBe("canceled");
  });
});
