import { describe, it, expect, vi, beforeAll } from "vitest";

process.env.DATA_SOURCE = "mock";

vi.mock("@/lib/data", async () => {
  const { mockRepository } = await import("@/lib/data/mock");
  return mockRepository;
});

import { createCheckoutOrderAction } from "./order.actions";
import { getOrderById } from "@/lib/data/orders";

describe("createCheckoutOrderAction", () => {
  it("creates a single-item checkout order successfully", async () => {
    const res = await createCheckoutOrderAction({
      listingId: "list-1",
      quantity: 2,
      buyerName: "Budi Santoso",
      buyerEmail: "budi@example.com",
      buyerPhone: "081234567890",
      buyerAddress: "Jl. Dago No. 100",
      buyerCity: "Bandung",
      shippingCourier: "JNE REG",
      shippingCost: 18000,
      notes: "Tolong segera dikirim",
    });

    expect(res.success).toBe(true);
    if (!res.success) return;

    expect(res.data.orderNumber).toMatch(/^ORD-/);
    const order = await getOrderById(res.data.orderId);
    expect(order).toBeDefined();
    expect(order?.buyerName).toBe("Budi Santoso");
    expect(order?.quantity).toBe(2);
  });

  it("creates a multi-item checkout order with aggregated subtotal and notes", async () => {
    const res = await createCheckoutOrderAction({
      listingId: "list-1",
      quantity: 1, // Fallback quantity
      buyerName: "Dewi Lestari",
      buyerEmail: "dewi@example.com",
      buyerPhone: "081987654321",
      buyerAddress: "Jl. Dipatiukur No. 12",
      buyerCity: "Bandung",
      shippingCourier: "SiCepat REG",
      shippingCost: 22000,
      notes: "Giling kasar untuk French Press",
      items: [
        { listingId: "list-1", quantity: 2 },
        { listingId: "list-2", quantity: 1 },
      ],
    });

    expect(res.success).toBe(true);
    if (!res.success) return;

    const order = await getOrderById(res.data.orderId);
    expect(order).toBeDefined();
    expect(order?.quantity).toBe(3); // 2 + 1
    expect(order?.notes).toContain("Paket Pesanan:");
    expect(order?.notes).toContain("Giling kasar untuk French Press");
    // list-1 price: 135000 * 2 = 270000; list-2 price: 110000 * 1 = 110000. Subtotal: 380000
    // totalAmount: 380000 + 22000 + 1500 = 403500
    expect(order?.subtotal).toBe(380000);
    expect(order?.totalAmount).toBe(403500);
  });

  it("fails if any product minimum order quantity is not met", async () => {
    const res = await createCheckoutOrderAction({
      listingId: "list-1",
      quantity: 0,
      buyerName: "Budi",
      buyerEmail: "budi@example.com",
      buyerPhone: "081234567890",
      buyerAddress: "Jl. Dago",
      buyerCity: "Bandung",
      shippingCourier: "JNE",
      shippingCost: 10000,
    });

    expect(res.success).toBe(false);
  });
});
