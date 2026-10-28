import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { randomUUID } from "crypto";

process.env.DATA_SOURCE = "mock";
process.env.PAYMENT_PROVIDER = "mock";

vi.mock("@/lib/data", async () => {
  const { mockRepository } = await import("@/lib/data/mock");
  return mockRepository;
});

import {
  createCheckoutOrderAction,
  getShippingRatesAction,
  checkOrderPaymentStatusAction,
  submitReviewAction,
  cancelPaidOrderAction,
} from "./order.actions";
import { getOrderById, createOrder, updateOrderStatus } from "@/lib/data/orders";
import { getRefundByOrderId } from "@/lib/data/refunds";

describe("createCheckoutOrderAction", () => {
  beforeAll(() => {
    vi.stubEnv("RAJAONGKIR_API_KEY", "");
  });

  afterAll(() => {
    vi.unstubAllEnvs();
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

  it("prevents stock-hold DoS by rejecting checkout if buyer already has pending order for same listing (N3)", async () => {
    const email = "hold_dos@example.com";
    const res1 = await createCheckoutOrderAction({
      listingId: "list-2",
      quantity: 1,
      buyerName: "Hold Buyer",
      buyerEmail: email,
      buyerPhone: "081234567890",
      buyerAddress: "Jl. Dago No. 1",
      buyerCity: "Bandung",
      shippingRateId: "jne-reg",
      idempotencyKey: randomUUID(),
    });
    expect(res1.success).toBe(true);

    const res2 = await createCheckoutOrderAction({
      listingId: "list-2",
      quantity: 1,
      buyerName: "Hold Buyer",
      buyerEmail: email,
      buyerPhone: "081234567890",
      buyerAddress: "Jl. Dago No. 1",
      buyerCity: "Bandung",
      shippingRateId: "jne-reg",
      idempotencyKey: randomUUID(),
    });
    expect(res2.success).toBe(false);
    if (!res2.success) {
      expect(res2.error).toMatch(/sudah memiliki pesanan yang menunggu pembayaran/);
    }
  });

  it("prevents stock-hold DoS by rejecting checkout if buyer has 3 or more pending orders (N3)", async () => {
    const email = "max_pending@example.com";
    // Create 3 orders on different listings
    for (const lid of ["list-3", "list-4", "list-9"]) {
      const res = await createCheckoutOrderAction({
        listingId: lid,
        quantity: 1,
        buyerName: "Max Pending Buyer",
        buyerEmail: email,
        buyerPhone: "081234567890",
        buyerAddress: "Jl. Dago No. 1",
        buyerCity: "Bandung",
        shippingRateId: "jne-reg",
        idempotencyKey: randomUUID(),
      });
      expect(res.success).toBe(true);
    }

    // 4th checkout should be rejected
    const res4 = await createCheckoutOrderAction({
      listingId: "list-10",
      quantity: 1,
      buyerName: "Max Pending Buyer",
      buyerEmail: email,
      buyerPhone: "081234567890",
      buyerAddress: "Jl. Dago No. 1",
      buyerCity: "Bandung",
      shippingRateId: "jne-reg",
      idempotencyKey: randomUUID(),
    });
    expect(res4.success).toBe(false);
    if (!res4.success) {
      expect(res4.error).toMatch(/3 pesanan yang belum diselesaikan pembayarannya/);
    }
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

describe("submitReviewAction (B1 verification & uniqueness)", () => {
  const buyerUserId = "user-buyer-101";

  it("rejects review if orderId is missing", async () => {
    const authSession = await import("@/lib/auth/session");
    const spy = vi.spyOn(authSession, "getSession").mockResolvedValueOnce({
      role: "buyer",
      userId: buyerUserId,
      sellerId: null,
      email: "buyer@example.com",
    });

    const res = await submitReviewAction({
      listingId: "list-1",
      rating: 5,
      comment: "Kopi mantap",
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("Ulasan hanya dapat diberikan dari pesanan yang sudah selesai");
    }
    spy.mockRestore();
  });

  it("rejects review if user is guest or not logged in", async () => {
    const authSession = await import("@/lib/auth/session");
    const spy = vi.spyOn(authSession, "getSession").mockResolvedValueOnce({
      role: "guest",
      userId: null,
      sellerId: null,
      email: null,
    });

    const res = await submitReviewAction({
      orderId: "ord-test-any",
      listingId: "list-1",
      rating: 5,
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("Silakan login");
    }
    spy.mockRestore();
  });

  it("rejects review if order belongs to another user or is guest order", async () => {
    const order = await createOrder({
      buyerId: "user-buyer-other",
      buyerName: "User Lain",
      buyerEmail: "other@example.com",
      buyerPhone: "08111111111",
      buyerAddress: "Jl. Lain",
      buyerCity: "Jakarta",
      sellerId: "seller-1",
      listingId: "list-1",
      quantity: 1,
      itemPrice: 100000,
      subtotal: 100000,
      shippingCost: 10000,
      serviceFee: 1500,
      totalAmount: 111500,
      shippingCourier: "jne",
    });
    await updateOrderStatus(order.id, "paid");
    await updateOrderStatus(order.id, "shipped", "JNE123456");
    await updateOrderStatus(order.id, "completed");

    const authSession = await import("@/lib/auth/session");
    const spy = vi.spyOn(authSession, "getSession").mockResolvedValueOnce({
      role: "buyer",
      userId: buyerUserId,
      sellerId: null,
      email: "buyer@example.com",
    });

    const res = await submitReviewAction({
      orderId: order.id,
      listingId: "list-1",
      rating: 5,
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("Anda hanya dapat mengulas produk dari pesanan Anda sendiri");
    }
    spy.mockRestore();
  });

  it("rejects review if order is not completed yet", async () => {
    const order = await createOrder({
      buyerId: buyerUserId,
      buyerName: "Pembeli Sah",
      buyerEmail: "buyer@example.com",
      buyerPhone: "08111111111",
      buyerAddress: "Jl. Sah",
      buyerCity: "Jakarta",
      sellerId: "seller-1",
      listingId: "list-1",
      quantity: 1,
      itemPrice: 100000,
      subtotal: 100000,
      shippingCost: 10000,
      serviceFee: 1500,
      totalAmount: 111500,
      shippingCourier: "jne",
    });

    const authSession = await import("@/lib/auth/session");
    const spy = vi.spyOn(authSession, "getSession").mockResolvedValueOnce({
      role: "buyer",
      userId: buyerUserId,
      sellerId: null,
      email: "buyer@example.com",
    });

    const res = await submitReviewAction({
      orderId: order.id,
      listingId: "list-1",
      rating: 5,
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("Ulasan hanya dapat diberikan setelah pesanan selesai diterima");
    }
    spy.mockRestore();
  });

  it("rejects review if listing is not part of the order", async () => {
    const order = await createOrder({
      buyerId: buyerUserId,
      buyerName: "Pembeli Sah",
      buyerEmail: "buyer@example.com",
      buyerPhone: "08111111111",
      buyerAddress: "Jl. Sah",
      buyerCity: "Jakarta",
      sellerId: "seller-1",
      listingId: "list-1",
      quantity: 1,
      itemPrice: 100000,
      subtotal: 100000,
      shippingCost: 10000,
      serviceFee: 1500,
      totalAmount: 111500,
      shippingCourier: "jne",
    });
    await updateOrderStatus(order.id, "paid");
    await updateOrderStatus(order.id, "shipped", "JNE123456");
    await updateOrderStatus(order.id, "completed");

    const authSession = await import("@/lib/auth/session");
    const spy = vi.spyOn(authSession, "getSession").mockResolvedValueOnce({
      role: "buyer",
      userId: buyerUserId,
      sellerId: null,
      email: "buyer@example.com",
    });

    const res = await submitReviewAction({
      orderId: order.id,
      listingId: "list-999-unrelated",
      rating: 5,
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("Produk ini tidak ada dalam pesanan tersebut");
    }
    spy.mockRestore();
  });

  it("submits review successfully and rejects duplicate review for same order and listing", async () => {
    const order = await createOrder({
      buyerId: buyerUserId,
      buyerName: "Pembeli Sah",
      buyerEmail: "buyer@example.com",
      buyerPhone: "08111111111",
      buyerAddress: "Jl. Sah",
      buyerCity: "Jakarta",
      sellerId: "seller-1",
      listingId: "list-1",
      quantity: 1,
      itemPrice: 100000,
      subtotal: 100000,
      shippingCost: 10000,
      serviceFee: 1500,
      totalAmount: 111500,
      shippingCourier: "jne",
    });
    await updateOrderStatus(order.id, "paid");
    await updateOrderStatus(order.id, "shipped", "JNE123456");
    await updateOrderStatus(order.id, "completed");

    const authSession = await import("@/lib/auth/session");
    const spy = vi.spyOn(authSession, "getSession").mockResolvedValue({
      role: "buyer",
      userId: buyerUserId,
      sellerId: null,
      email: "buyer@example.com",
    });

    const firstRes = await submitReviewAction({
      orderId: order.id,
      listingId: "list-1",
      rating: 5,
      comment: "Aroma fruity luar biasa!",
    });
    expect(firstRes.success).toBe(true);

    const duplicateRes = await submitReviewAction({
      orderId: order.id,
      listingId: "list-1",
      rating: 4,
      comment: "Mencoba ulas lagi",
    });
    expect(duplicateRes.success).toBe(false);
    if (!duplicateRes.success) {
      expect(duplicateRes.error).toContain("sudah memberikan ulasan");
    }

    spy.mockRestore();
  });

  describe("cancelPaidOrderAction (B6)", () => {
    it("fails when attempting to cancel an order that is not paid", async () => {
      const order = await createOrder({
        buyerName: "Buyer Unpaid",
        buyerEmail: "unpaid@example.com",
        buyerPhone: "08123456789",
        buyerAddress: "Jl Kopi No 1",
        buyerCity: "Jakarta",
        sellerId: "seller-1",
        listingId: "list-1",
        quantity: 1,
        itemPrice: 100000,
        subtotal: 100000,
        shippingCost: 10000,
        serviceFee: 1500,
        totalAmount: 111500,
        shippingCourier: "jne",
      });

      const res = await cancelPaidOrderAction(order.id, "Batal");
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("Hanya pesanan yang sudah dibayar");
      }
    });

    it("successfully cancels a paid order and creates a refund record with stock restoration", async () => {
      const { mockListings } = await import("@/lib/mock/data");
      const listing = mockListings[0];
      const initialStock = listing.stock ?? 30;

      const buyerId = `buyer-refund-${Date.now()}`;
      const order = await createOrder({
        buyerId,
        buyerName: "Buyer Refund",
        buyerEmail: "refund@example.com",
        buyerPhone: "08123456789",
        buyerAddress: "Jl Kopi No 2",
        buyerCity: "Bandung",
        sellerId: listing.sellerId,
        listingId: listing.id,
        quantity: 2,
        itemPrice: 100000,
        subtotal: 200000,
        shippingCost: 10000,
        serviceFee: 1500,
        totalAmount: 211500,
        shippingCourier: "jne",
      });

      // Advance status to paid
      await updateOrderStatus(order.id, "paid");

      const authSession = await import("@/lib/auth/session");
      const spy = vi.spyOn(authSession, "getSession").mockResolvedValue({
        role: "buyer",
        userId: buyerId,
        sellerId: null,
        email: "refund@example.com",
      });

      const res = await cancelPaidOrderAction(order.id, "Ingin ganti varian");
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data?.refundStatus).toBe("processed");
      }

      // Check order status changed to canceled
      const updated = await getOrderById(order.id);
      expect(updated?.status).toBe("canceled");

      // Check stock restored
      expect(listing.stock).toBe(initialStock);

      // Check refund record in database
      const refund = await getRefundByOrderId(order.id);
      expect(refund).not.toBeNull();
      expect(refund?.amount).toBe(211500);
      expect(refund?.reason).toBe("Ingin ganti varian");
      expect(refund?.status).toBe("processed");

      spy.mockRestore();
    });

    it("rejects buyer cancellation when order payment is older than 6 hours (F17)", async () => {
      const buyerId = `buyer-window-${Date.now()}`;
      const order = await createOrder({
        buyerId,
        buyerName: "Buyer Window",
        buyerEmail: "window@example.com",
        buyerPhone: "08123456789",
        buyerAddress: "Jl Kopi No 5",
        buyerCity: "Bandung",
        sellerId: "seller-1",
        listingId: "list-1",
        quantity: 1,
        itemPrice: 50000,
        subtotal: 50000,
        shippingCost: 10000,
        serviceFee: 1500,
        totalAmount: 61500,
        shippingCourier: "jne",
      });

      await updateOrderStatus(order.id, "paid");
      // Simulate order paid 7 hours ago
      order.paidAt = new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString();
      order.updatedAt = order.paidAt;

      const authSession = await import("@/lib/auth/session");
      const spy = vi.spyOn(authSession, "getSession").mockResolvedValue({
        role: "buyer",
        userId: buyerId,
        sellerId: null,
        email: "window@example.com",
      });

      const res = await cancelPaidOrderAction(order.id, "Batal lewat waktu");
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("Batas waktu pembatalan mandiri oleh pembeli telah berakhir");
      }

      spy.mockRestore();
    });
  });
});
