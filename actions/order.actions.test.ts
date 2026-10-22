import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { randomUUID } from "crypto";

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
  const savedRajaKey = process.env.RAJAONGKIR_API_KEY;

  beforeAll(() => {
    delete process.env.RAJAONGKIR_API_KEY;
  });

  afterAll(() => {
    if (savedRajaKey) {
      process.env.RAJAONGKIR_API_KEY = savedRajaKey;
    }
  });

  it("creates a single-item checkout order successfully and ignores manipulated client shipping cost", async () => {
    const idempotencyKey = randomUUID();
    const res = await createCheckoutOrderAction({
      listingId: "list-1",
      quantity: 2,
      buyerName: "Budi Santoso",
      buyerEmail: "budi@example.com",
      buyerPhone: "081234567890",
      buyerAddress: "Jl. Dago No. 100",
      buyerCity: "Bandung",
      buyerProvince: "Jawa Barat",
      shippingRateId: "jne-reg",
      shippingCost: 100, // manipulated by malicious client!
      idempotencyKey,
      notes: "Tolong segera dikirim",
    });

    expect(res.success).toBe(true);
    if (!res.success) return;

    expect(res.data.orderNumber).toMatch(/^ORD-/);
    expect(res.data.accessToken).toBeDefined();

    const order = await getOrderById(res.data.orderId);
    expect(order).toBeDefined();
    expect(order?.buyerName).toBe("Budi Santoso");
    expect(order?.quantity).toBe(2);
    // Manipulated shipping cost 100 was ignored in favor of real server rate (e.g. >= 9000)
    expect(order?.shippingCost).toBeGreaterThan(100);
  });

  it("creates a multi-item checkout order with aggregated subtotal and notes", async () => {
    const idempotencyKey = randomUUID();
    // list-1 (135,000) and list-9 (65,000) are both seller-1
    const res = await createCheckoutOrderAction({
      listingId: "list-1",
      quantity: 1,
      buyerName: "Dewi Lestari",
      buyerEmail: "dewi@example.com",
      buyerPhone: "081987654321",
      buyerAddress: "Jl. Dipatiukur No. 12",
      buyerCity: "Bandung",
      shippingRateId: "jne-reg",
      idempotencyKey,
      notes: "Giling kasar untuk French Press",
      items: [
        { listingId: "list-1", quantity: 2 },
        { listingId: "list-9", quantity: 1 },
      ],
    });

    expect(res.success).toBe(true);
    if (!res.success) return;

    const order = await getOrderById(res.data.orderId);
    expect(order).toBeDefined();
    expect(order?.quantity).toBe(3);
    expect(order?.notes).toContain("Paket Pesanan:");
    expect(order?.notes).toContain("Giling kasar untuk French Press");
    // list-1 price: 135000 * 2 = 270000; list-9 price: 65000 * 1 = 65000. Subtotal: 335000
    expect(order?.subtotal).toBe(335000);
  });

  it("rejects multi-item checkout if items belong to different sellers", async () => {
    const idempotencyKey = randomUUID();
    // list-1 is seller-1; list-2 is seller-2
    const res = await createCheckoutOrderAction({
      listingId: "list-1",
      quantity: 1,
      buyerName: "Buyer Multi",
      buyerEmail: "multi@example.com",
      buyerPhone: "081234567890",
      buyerAddress: "Jl. Merdeka",
      buyerCity: "Jakarta",
      shippingRateId: "jne-reg",
      idempotencyKey,
      items: [
        { listingId: "list-1", quantity: 1 },
        { listingId: "list-2", quantity: 1 },
      ],
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("Satu pembayaran hanya untuk satu toko");
    }
  });

  it("is idempotent: two calls with same idempotencyKey return the same order", async () => {
    const idempotencyKey = randomUUID();
    const payload = {
      listingId: "list-1",
      quantity: 1,
      buyerName: "Idempotent Buyer",
      buyerEmail: "idem@example.com",
      buyerPhone: "081234567890",
      buyerAddress: "Jl. Asia Afrika",
      buyerCity: "Bandung",
      shippingRateId: "jne-reg",
      idempotencyKey,
    };

    const first = await createCheckoutOrderAction(payload);
    const second = await createCheckoutOrderAction(payload);

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    if (!first.success || !second.success) return;

    expect(first.data.orderNumber).toBe(second.data.orderNumber);
    expect(first.data.orderId).toBe(second.data.orderId);
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
      shippingRateId: "jne-reg",
      idempotencyKey: randomUUID(),
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
      shippingRateId: "jne-reg",
      idempotencyKey: randomUUID(),
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
      shippingRateId: "jne-reg",
      idempotencyKey: randomUUID(),
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
      shippingRateId: "jne-reg",
      idempotencyKey: randomUUID(),
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("tidak dapat membeli produk dari toko Anda sendiri");
    }

    spy.mockRestore();
  });

  it("calculates shipping rates via getShippingRatesAction server action", async () => {
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
  });

  it("checks order payment status via checkOrderPaymentStatusAction with valid token", async () => {
    const created = await createCheckoutOrderAction({
      listingId: "list-1",
      quantity: 1,
      buyerName: "Tester Payment",
      buyerEmail: "tester@example.com",
      buyerPhone: "081234567890",
      buyerAddress: "Jl. Test No. 1",
      buyerCity: "Bandung",
      shippingRateId: "jne-reg",
      idempotencyKey: randomUUID(),
    });

    expect(created.success).toBe(true);
    if (!created.success) return;

    const res = await checkOrderPaymentStatusAction(
      created.data.orderId,
      created.data.accessToken,
    );
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.status).toBe("pending_payment");
    expect(res.data.isPaid).toBe(false);
  });
});
