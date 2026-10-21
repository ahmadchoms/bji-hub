import { describe, it, expect, vi, beforeAll } from "vitest";

process.env.DATA_SOURCE = "mock";

vi.mock("@/lib/data", async () => {
  const { mockRepository } = await import("@/lib/data/mock");
  return mockRepository;
});

import {
  createCheckoutOrderAction,
  getShippingRatesAction,
  checkOrderPaymentStatusAction,
} from "./order.actions";
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

  it("attaches grindSize to order notes when provided for single item", async () => {
    const res = await createCheckoutOrderAction({
      listingId: "list-1",
      quantity: 1,
      buyerName: "Ahmad Barista",
      buyerEmail: "ahmad@example.com",
      buyerPhone: "081234567890",
      buyerAddress: "Jl. Riau No. 15",
      buyerCity: "Bandung",
      shippingCourier: "JNE REG",
      shippingCost: 15000,
      grindSize: "Giling Halus",
      notes: "Tolong pack rapi",
    });

    expect(res.success).toBe(true);
    if (!res.success) return;

    const order = await getOrderById(res.data.orderId);
    expect(order?.notes).toContain("[Gilingan: Giling Halus]");
    expect(order?.notes).toContain("Tolong pack rapi");
  });

  it("fails when attempting to order an out-of-stock product", async () => {
    // list-5 has stock: 0 in mock data
    const res = await createCheckoutOrderAction({
      listingId: "list-5",
      quantity: 1,
      buyerName: "Buyer Test",
      buyerEmail: "buyer@example.com",
      buyerPhone: "081234567890",
      buyerAddress: "Jl. Sudirman",
      buyerCity: "Jakarta",
      shippingCourier: "JNE",
      shippingCost: 10000,
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("habis terjual");
    }
  });

  it("prevents seller from purchasing their own listing (self-purchase guard)", async () => {
    const authSession = await import("@/lib/auth/session");
    const spy = vi.spyOn(authSession, "getSession").mockResolvedValueOnce({
      role: "seller",
      sellerId: "seller-1",
      userId: "user-seller-1",
      email: "seller@bijihub.com",
    });

    const res = await createCheckoutOrderAction({
      listingId: "list-1",
      quantity: 1,
      buyerName: "Pak Hendra Owner",
      buyerEmail: "seller@bijihub.com",
      buyerPhone: "081234567890",
      buyerAddress: "Jl. Takengon",
      buyerCity: "Takengon",
      shippingCourier: "JNE",
      shippingCost: 10000,
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("tidak dapat membeli produk dari toko Anda sendiri");
    }

    spy.mockRestore();
  });

  it("calculates shipping rates via getShippingRatesAction server action", async () => {
    const prevKey = process.env.RAJAONGKIR_API_KEY;
    delete process.env.RAJAONGKIR_API_KEY;

    try {
      const res = await getShippingRatesAction({
        originCity: "Takengon",
        originProvince: "Aceh",
        destinationCity: "Bandung",
        destinationProvince: "Jawa Barat",
        weightGrams: 2000,
      });

      expect(res.success).toBe(true);
      if (!res.success) return;

      expect(res.data.length).toBeGreaterThan(0);
      const jne = res.data.find((r) => r.courierCode === "jne");
      expect(jne).toBeDefined();
      expect(jne?.cost).toBeGreaterThan(0);
    } finally {
      if (prevKey) process.env.RAJAONGKIR_API_KEY = prevKey;
    }
  });

  it("checks order payment status via checkOrderPaymentStatusAction", async () => {
    const created = await createCheckoutOrderAction({
      listingId: "list-1",
      quantity: 1,
      buyerName: "Tester Payment",
      buyerEmail: "tester@example.com",
      buyerPhone: "081234567890",
      buyerAddress: "Jl. Test No. 1",
      buyerCity: "Bandung",
      shippingCourier: "JNE",
      shippingCost: 10000,
    });

    expect(created.success).toBe(true);
    if (!created.success) return;

    const res = await checkOrderPaymentStatusAction(created.data.orderId);
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.status).toBe("pending_payment");
    expect(res.data.isPaid).toBe(false);
  });
});
