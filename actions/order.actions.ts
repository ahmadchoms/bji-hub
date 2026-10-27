"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { readBuyerProfileCookie, serializeBuyerProfile, BUYER_PROFILE_COOKIE } from "@/lib/auth/buyer-profile";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getListingBySlug, getListingById, getSellerById } from "@/lib/data";
import {
  createOrder,
  getOrderById,
  getOrdersByBuyer,
  updateOrderStatus,
  transitionOrderStatus,
  updateOrderSnapToken,
  generateOrderNumber,
  autoCompleteExpiredShippedOrders,
} from "@/lib/data/orders";
import { createReview, getReviewByOrderAndListing } from "@/lib/data/reviews";
import { getPaymentProvider } from "@/lib/payments";
import { getSession, requireRole } from "@/lib/auth/session";
import { canAccessOrder } from "@/lib/auth/order-access";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";
import { computeTotalWeightGrams } from "@/lib/shipping-weight";
import { isOwnedImageUrl } from "@/lib/storage";
import {
  calculateShippingRates,
  trackShipmentWaybill,
  type ShippingRate,
  type WaybillTrackingResult,
} from "@/lib/shipping";
import {
  sendOrderPaidEmail,
  sendOrderShippedEmail,
  sendNewOrderSellerEmail,
  sendOrderRefundedEmail,
} from "@/lib/email";
import {
  createRefundRecord,
  getRefundByOrderId,
  updateRefundStatus,
} from "@/lib/data/refunds";
import { recordAuditLog } from "@/lib/data/audit-logs";

const checkoutItemSchema = z.object({
  listingId: z.string().min(1, "ID produk wajib diisi"),
  quantity: z.number().int().min(1, "Jumlah produk minimal 1"),
  grindSize: z.string().optional(),
});

const checkoutSchema = z.object({
  listingId: z.string().min(1, "Produk wajib dipilih"),
  quantity: z.number().int().min(1, "Jumlah pesanan minimal 1"),
  buyerName: z.string().min(2, "Nama penerima minimal 2 karakter"),
  buyerEmail: z.string().email("Format email tidak valid"),
  buyerPhone: z.string().min(8, "Nomor telepon/WhatsApp wajib diisi"),
  buyerAddress: z.string().min(5, "Alamat pengiriman minimal 5 karakter"),
  buyerCity: z.string().min(2, "Kota pengiriman wajib diisi"),
  buyerProvince: z.string().optional(),
  shippingRateId: z.string().min(1, "Opsi pengiriman wajib dipilih"),
  idempotencyKey: z.string().uuid("Kunci idempotensi tidak valid"),
  shippingCost: z.number().optional(), // ignored in favor of server calculation
  shippingCourier: z.string().optional(), // ignored in favor of server calculation
  grindSize: z.string().optional(),
  notes: z.string().max(500).optional(),
  items: z.array(checkoutItemSchema).optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export async function createCheckoutOrderAction(
  input: unknown,
): Promise<
  ActionResult<{
    orderId: string;
    orderNumber: string;
    snapToken: string | null;
    payment: {
      provider: "midtrans" | "mock";
      token: string | null;
    };
    totalAmount: number;
    accessToken: string;
  }>
> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      "Data pesanan tidak valid",
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  // Rate limit checkout requests per client IP (stock-hold DoS mitigation)
  const clientIp = await getClientIp();
  const checkoutRl = await checkRateLimit(`checkout:ip:${clientIp}`, 30, 60_000);
  if (!checkoutRl.success) {
    return fail("Terlalu banyak permintaan checkout. Silakan coba beberapa saat lagi.");
  }

  const {
    listingId,
    quantity,
    buyerName,
    buyerEmail,
    buyerPhone,
    buyerAddress,
    buyerCity,
    buyerProvince,
    shippingRateId,
    idempotencyKey,
    grindSize,
    notes,
    items,
  } = parsed.data;

  // 0. Idempotency fast-path: if order with this idempotency key already exists, return it immediately
  if (idempotencyKey) {
    const existing = await getOrderById(idempotencyKey);
    if (existing) {
      return ok({
        orderId: existing.id,
        orderNumber: existing.orderNumber,
        snapToken: existing.snapToken ?? null,
        payment: {
          provider: (existing.paymentProvider as "midtrans" | "mock") ?? "midtrans",
          token: existing.snapToken ?? null,
        },
        totalAmount: existing.totalAmount,
        accessToken: existing.accessToken || "",
      });
    }
  }

  // Stock-hold protection: check active pending orders for buyer/email
  const session = await getSession();
  const normalizedEmail = buyerEmail.trim().toLowerCase();
  const buyerOrders = await getOrdersByBuyer(session.userId || undefined, normalizedEmail);
  const pendingOrders = buyerOrders.filter((o) => o.status === "pending_payment");
  if (pendingOrders.length >= 3) {
    return fail(
      "Anda memiliki 3 pesanan yang belum diselesaikan pembayarannya. Silakan selesaikan atau batalkan pesanan sebelumnya untuk membuat pesanan baru.",
    );
  }

  // 1. Normalize & deduplicate items (same listingId + grindSize)
  const rawItems =
    items && items.length > 0
      ? items
      : [{ listingId, quantity, grindSize }];

  const deduplicatedMap = new Map<
    string,
    { listingId: string; quantity: number; grindSize?: string }
  >();

  for (const it of rawItems) {
    const key = `${it.listingId}::${it.grindSize || ""}`;
    const existing = deduplicatedMap.get(key);
    if (existing) {
      existing.quantity += it.quantity;
    } else {
      deduplicatedMap.set(key, { ...it });
    }
  }
  const normalizedItems = Array.from(deduplicatedMap.values());

  // 2. Fetch and validate all listings
  const resolvedItems = [];
  for (const it of normalizedItems) {
    const l =
      (await getListingById(it.listingId)) ||
      (await getListingBySlug(it.listingId));
    if (!l) {
      return fail(
        `Salah satu produk dalam pesanan tidak ditemukan (${it.listingId})`,
      );
    }
    if (l.status && l.status !== "active") {
      return fail(`Produk "${l.title}" sedang tidak aktif atau diarsipkan`);
    }
    if (l.stock === 0) {
      return fail(`Maaf, stok untuk "${l.title}" telah habis terjual`);
    }
    if (l.stock !== undefined && it.quantity > l.stock) {
      return fail(
        `Pesanan untuk "${l.title}" (${it.quantity}) melebihi stok yang tersedia (${l.stock} ${l.unit})`,
      );
    }
    if (l.minOrderQty !== undefined && it.quantity < l.minOrderQty) {
      return fail(
        `Minimal pemesanan untuk ${l.title} adalah ${l.minOrderQty} ${l.unit}`,
      );
    }
    const pendingSameListing = pendingOrders.some((po) => po.listingId === l.id);
    if (pendingSameListing) {
      return fail(
        `Anda sudah memiliki pesanan yang menunggu pembayaran untuk produk "${l.title}". Silakan selesaikan pembayaran atau batalkan pesanan sebelumnya.`,
      );
    }
    resolvedItems.push({
      listing: l,
      quantity: it.quantity,
      grindSize: it.grindSize,
    });
  }

  // 3. Enforce single seller across all items
  const targetSellerId = resolvedItems[0].listing.sellerId;
  for (const it of resolvedItems) {
    if (it.listing.sellerId !== targetSellerId) {
      return fail(
        "Satu pembayaran hanya untuk satu toko. Pisahkan produk dari toko berbeda ke checkout terpisah.",
      );
    }
  }

  // Self-purchase prevention
  if (session.sellerId && targetSellerId === session.sellerId) {
    return fail("Anda tidak dapat membeli produk dari toko Anda sendiri.");
  }

  // 4. Calculate subtotal and build items breakdown
  let subtotal = 0;
  let totalQuantity = 0;
  const summaryList: string[] = [];
  const weightItems: { quantity: number; unit?: string | null }[] = [];
  const orderItemsData = [];

  for (const it of resolvedItems) {
    const { listing: l, quantity: q, grindSize: gs } = it;
    const itemSubtotal = Number(l.price) * q;
    subtotal += itemSubtotal;
    totalQuantity += q;
    weightItems.push({ quantity: q, unit: l.unit });
    const grindNote = gs ? ` [${gs}]` : "";
    summaryList.push(`${l.title}${grindNote} (${q} ${l.unit})`);
    orderItemsData.push({
      listingId: l.id,
      title: l.title,
      unitPrice: Number(l.price),
      quantity: q,
      unit: l.unit || "250g",
      grindSize: gs || null,
    });
  }

  // 5. Server-side shipping recalculation
  const totalWeightGrams = computeTotalWeightGrams(weightItems, totalQuantity);
  const seller = await getSellerById(targetSellerId);
  const originCity =
    seller?.city || resolvedItems[0].listing.seller?.city || "Jakarta";
  const originProvince =
    seller?.province || resolvedItems[0].listing.seller?.province;

  const rates = await calculateShippingRates({
    originCity,
    originProvince,
    destinationCity: buyerCity,
    destinationProvince: buyerProvince,
    weightGrams: totalWeightGrams,
  });

  const matchedRate = rates.find(
    (r) => r.id === shippingRateId || r.id.startsWith(shippingRateId + "-"),
  );
  if (!matchedRate) {
    return fail("Opsi pengiriman tidak valid, silakan pilih ulang");
  }

  const serverShippingCost = matchedRate.cost;
  const serverShippingCourier = `${matchedRate.courierName} ${matchedRate.service}`;

  const serviceFee = 1500;
  const totalAmount = subtotal + serverShippingCost + serviceFee;
  const multiItemSummary =
    summaryList.length > 1 ? `[Paket Pesanan: ${summaryList.join(", ")}]` : "";
  const singleItemGrind =
    summaryList.length === 1 && resolvedItems[0].grindSize
      ? `[Gilingan: ${resolvedItems[0].grindSize}]`
      : "";
  const combinedNotes = [multiItemSummary || singleItemGrind, notes]
    .filter(Boolean)
    .join(" ");

  const orderNumber = generateOrderNumber();
  const accessToken = randomBytes(24).toString("base64url");
  const buyerId = session.userId ?? null;

  // 6. Persist order first (atomic with order_items in DB mode)
  const order = await createOrder({
    orderNumber,
    buyerId,
    buyerName,
    buyerEmail,
    buyerPhone,
    buyerAddress,
    buyerCity,
    sellerId: targetSellerId,
    listingId: resolvedItems[0].listing.id,
    quantity: totalQuantity,
    itemPrice: Number(resolvedItems[0].listing.price),
    subtotal,
    shippingCost: serverShippingCost,
    serviceFee,
    totalAmount,
    shippingCourier: serverShippingCourier,
    midtransOrderId: orderNumber,
    paymentProvider: getPaymentProvider().id,
    notes: combinedNotes || null,
    idempotencyKey,
    accessToken,
    items: orderItemsData,
  });

  // 7. Request Payment Token via provider
  const provider = getPaymentProvider();
  let snapToken: string | null = null;
  let paymentToken: string | null = null;
  try {
    const paymentResult = await provider.createPayment({
      orderRef: order.midtransOrderId || order.orderNumber,
      amount: order.totalAmount,
      customer: {
        name: buyerName,
        email: buyerEmail,
        phone: buyerPhone,
      },
      items: orderItemsData.map((item) => ({
        id: item.listingId,
        name: item.title,
        price: item.unitPrice,
        quantity: item.quantity,
      })),
    });
    if (paymentResult) {
      paymentToken = paymentResult.clientToken;
      snapToken = paymentResult.clientToken;
      if (snapToken) {
        await updateOrderSnapToken(order.id, snapToken);
      }
    }
  } catch {
    // ignore: optional operation fallback
    // Payment gateway timeout / mock offline
  }

  // 8. Cloud sync buyer profile
  if (
    process.env.DATA_SOURCE !== "mock" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.updateUser({
          data: {
            name: buyerName.trim(),
            phone: buyerPhone.trim(),
            address: buyerAddress.trim(),
            city: buyerCity.trim(),
          },
        });
      }
    } catch {
      // ignore: user order lookup fallback
    }
  }

  try {
    const cookieStore = await cookies();
    if (process.env.DATA_SOURCE === "mock") {
      const existing = readBuyerProfileCookie(cookieStore);
      const serialized = serializeBuyerProfile({
        ...existing,
        name: buyerName.trim(),
        phone: buyerPhone.trim(),
        address: buyerAddress.trim(),
        city: buyerCity.trim(),
      });
      cookieStore.set(BUYER_PROFILE_COOKIE, serialized, {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    } else {
      cookieStore.delete(BUYER_PROFILE_COOKIE);
    }
  } catch {
    // ignore: optional buyer profile cookie persistence
  }

  return ok({
    orderId: order.id,
    orderNumber: order.orderNumber,
    snapToken,
    payment: {
      provider: provider.id,
      token: paymentToken,
    },
    totalAmount: order.totalAmount,
    accessToken: order.accessToken || accessToken,
  });
}

export async function confirmOrderPaymentAction(
  orderIdOrNumber: string,
): Promise<ActionResult<{ success: boolean }>> {
  const session = await getSession();
  if (session.role !== "admin") {
    return fail("Hanya admin yang dapat mengonfirmasi pembayaran secara manual.");
  }

  const order = await getOrderById(orderIdOrNumber);
  if (!order) return fail("Pesanan tidak ditemukan");

  await updateOrderStatus(order.id, "paid");
  sendOrderPaidEmail({ ...order, status: "paid" }).catch((err) =>
    logger.error("Failed to send paid email", err, { orderId: order.id }),
  );

  getSellerById(order.sellerId)
    .then((seller) => {
      sendNewOrderSellerEmail({
        order: { ...order, status: "paid" },
        sellerEmail: seller?.user?.email,
        sellerName: seller?.businessName || order.sellerName,
      }).catch((err) =>
        logger.error("Failed to send seller new order email", err, { orderId: order.id }),
      );
    })
    .catch(() => {});

  revalidatePath("/orders");
  revalidatePath("/order/success");
  revalidatePath("/dashboard/orders");
  return ok({ success: true });
}

export async function updateShipmentTrackingAction(
  orderId: string,
  trackingNumber: string,
): Promise<ActionResult<{ success: boolean }>> {
  if (!trackingNumber || trackingNumber.trim().length < 3) {
    return fail("Nomor resi pengiriman tidak valid");
  }

  const session = await getSession();
  const order = await getOrderById(orderId);
  if (!order) return fail("Pesanan tidak ditemukan");

  const isSeller = Boolean(session.sellerId && order.sellerId === session.sellerId);
  const isAdmin = session.role === "admin";
  if (!isSeller && !isAdmin) {
    return fail("Anda tidak memiliki akses untuk memperbarui resi pesanan ini");
  }

  const cleanResi = trackingNumber.trim();
  await updateOrderStatus(order.id, "shipped", cleanResi);
  sendOrderShippedEmail({
    ...order,
    status: "shipped",
    trackingNumber: cleanResi,
  }).catch((err) => logger.error("Failed to send shipped email", err, { orderId: order.id }));

  return ok({ success: true });
}

export async function completeOrderAction(
  orderId: string,
): Promise<ActionResult<{ success: boolean }>> {
  const session = await getSession();
  const order = await getOrderById(orderId);
  if (!order) return fail("Pesanan tidak ditemukan");

  const isBuyer = Boolean(session.userId && order.buyerId === session.userId);
  const isAdmin = session.role === "admin";
  if (!isBuyer && !isAdmin) {
    return fail("Hanya pembeli yang bersangkutan yang dapat mengonfirmasi pesanan diterima");
  }

  await updateOrderStatus(order.id, "completed");
  revalidatePath("/orders");
  revalidatePath("/order/success");
  revalidatePath("/profile");
  revalidatePath("/dashboard/orders");
  return ok({ success: true });
}

const disputeSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(5, "Alasan komplain minimal 5 karakter").max(500),
  evidenceUrl: z
    .string()
    .max(500)
    .refine((val) => !val || isOwnedImageUrl(val), "URL gambar tidak valid")
    .optional()
    .nullable(),
});

export async function disputeOrderAction(
  input: unknown,
): Promise<ActionResult<{ success: boolean }>> {
  const parsed = disputeSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Data komplain tidak valid", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const session = await getSession();
  const order = await getOrderById(parsed.data.orderId);
  if (!order) return fail("Pesanan tidak ditemukan");

  const isBuyer = Boolean(session.userId && order.buyerId === session.userId);
  const isAdmin = session.role === "admin";
  if (!isBuyer && !isAdmin) {
    return fail("Hanya pembeli yang bersangkutan yang dapat mengajukan komplain");
  }

  if (order.status !== "shipped" && order.status !== "paid") {
    return fail("Hanya pesanan yang sudah dibayar atau dikirim yang dapat diajukan komplain");
  }

  await updateOrderStatus(
    order.id,
    "disputed",
    undefined,
    parsed.data.reason.trim(),
    parsed.data.evidenceUrl || undefined,
  );
  revalidatePath("/order/success");
  revalidatePath("/profile");
  revalidatePath("/dashboard/orders");
  revalidatePath("/admin/transactions");

  return ok({ success: true });
}

export async function resolveDisputeAction(
  orderId: string,
  decision: "complete" | "cancel",
): Promise<ActionResult<{ success: boolean }>> {
  const session = await requireRole(["admin"], "/admin/transactions");

  const order = await getOrderById(orderId);
  if (!order) return fail("Pesanan tidak ditemukan");

  if (decision === "cancel") {
    // 1. Guard against duplicate refund
    const existingRefund = await getRefundByOrderId(order.id);
    if (existingRefund && (existingRefund.status === "processed" || existingRefund.status === "pending")) {
      return fail("Pengembalian dana untuk pesanan ini sedang diproses atau telah selesai.");
    }

    // 2. Outbox pattern (N1): Create pending refund record first with deterministic ID
    const refundId = `ref-${order.id}`;
    let refundRecord;
    try {
      refundRecord = await createRefundRecord({
        id: refundId,
        orderId: order.id,
        amount: order.totalAmount,
        reason: "Komplain disetujui admin untuk pengembalian dana",
        status: "pending",
        createdBy: "admin",
      });
    } catch (e) {
      logger.error("order.refund_outbox_failed", e, { orderId: order.id });
      return fail("Gagal membuat catatan pengembalian dana");
    }

    // 3. Transition order status to canceled
    const transition = await transitionOrderStatus(order.id, "canceled");
    if (!transition.applied) return fail("Gagal memperbarui status komplain");

    // 4. Request refund with deterministic key
    const provider = getPaymentProvider();
    const refundRes = await provider.refund(
      order.midtransOrderId || order.orderNumber,
      order.totalAmount,
      "Komplain disetujui admin untuk pengembalian dana",
      { refundKey: `refund-${refundRecord.id}` },
    );

    // 5. Update refund status
    await updateRefundStatus(refundRecord.id, {
      status: refundRes.status,
      providerRef: refundRes.providerRef,
      failureReason: refundRes.message || null,
      attempts: 1,
    });

    sendOrderRefundedEmail(order, {
      amount: order.totalAmount,
      reason: "Komplain disetujui admin untuk pengembalian dana",
      status: refundRes.status,
    }).catch((err) => {
      logger.warn("order.refund_email_failed", { orderId: order.id, error: String(err) });
    });
  } else {
    await transitionOrderStatus(order.id, "completed");
  }

  const clientIp = await getClientIp();
  await recordAuditLog({
    actorId: session.userId || "admin",
    actorRole: session.role,
    action: decision === "cancel" ? "dispute_resolve_refund" : "dispute_resolve_complete",
    targetId: order.id,
    targetType: "order",
    details: { decision },
    ipAddress: clientIp,
  });

  try {
    revalidatePath("/order/success");
    revalidatePath("/profile");
    revalidatePath("/dashboard/orders");
    revalidatePath("/admin/transactions");
  } catch {
    // ignore: test environment
  }

  return ok({ success: true });
}

export async function sellerResolveDisputeAction(
  orderId: string,
  resolution: "refund" | "reship",
  newTrackingNumber?: string,
): Promise<ActionResult<{ success: boolean }>> {
  const session = await getSession();
  const sellerId = session.sellerId;
  const order = await getOrderById(orderId);
  if (!order) return fail("Pesanan tidak ditemukan");

  if (session.role !== "admin" && (!sellerId || order.sellerId !== sellerId)) {
    return fail("Anda tidak memiliki akses untuk menyelesaikan komplain pesanan ini");
  }

  if (order.status !== "disputed") {
    return fail("Pesanan tidak sedang dalam status komplain");
  }

  if (resolution === "refund") {
    // 1. Guard against duplicate refund
    const existingRefund = await getRefundByOrderId(order.id);
    if (existingRefund && (existingRefund.status === "processed" || existingRefund.status === "pending")) {
      return fail("Pengembalian dana untuk pesanan ini sedang diproses atau telah selesai.");
    }

    // 2. Outbox pattern (N1): Create pending refund record first
    const refundId = `ref-${order.id}`;
    let refundRecord;
    try {
      refundRecord = await createRefundRecord({
        id: refundId,
        orderId: order.id,
        amount: order.totalAmount,
        reason: "Komplain disetujui penjual untuk pengembalian dana",
        status: "pending",
        createdBy: session.userId || sellerId,
      });
    } catch (e) {
      logger.error("order.refund_outbox_failed", e, { orderId: order.id });
      return fail("Gagal membuat catatan pengembalian dana");
    }

    // 3. Transition order status to canceled
    const transition = await transitionOrderStatus(order.id, "canceled");
    if (!transition.applied) return fail("Gagal memperbarui status komplain");

    // 4. Request refund with deterministic key
    const provider = getPaymentProvider();
    const refundRes = await provider.refund(
      order.midtransOrderId || order.orderNumber,
      order.totalAmount,
      "Komplain disetujui penjual untuk pengembalian dana",
      { refundKey: `refund-${refundRecord.id}` },
    );

    // 5. Update refund status
    await updateRefundStatus(refundRecord.id, {
      status: refundRes.status,
      providerRef: refundRes.providerRef,
      failureReason: refundRes.message || null,
      attempts: 1,
    });

    sendOrderRefundedEmail(order, {
      amount: order.totalAmount,
      reason: "Komplain disetujui penjual untuk pengembalian dana",
      status: refundRes.status,
    }).catch((err) => {
      logger.warn("order.refund_email_failed", { orderId: order.id, error: String(err) });
    });
  } else if (resolution === "reship") {
    if (!newTrackingNumber || newTrackingNumber.trim().length < 3) {
      return fail("Nomor resi paket pengganti wajib diisi");
    }
    const cleanReship = newTrackingNumber.trim();
    await updateOrderStatus(order.id, "shipped", cleanReship);
    sendOrderShippedEmail({
      ...order,
      status: "shipped",
      trackingNumber: cleanReship,
    }).catch((err) => logger.error("Failed to send reship email", err, { orderId: order.id }));
  }

  try {
    revalidatePath("/order/success");
    revalidatePath("/profile");
    revalidatePath("/dashboard/orders");
    revalidatePath("/admin/transactions");
  } catch {
    // ignore: test environment
  }

  return ok({ success: true });
}

export async function autoCompleteOrdersAction(): Promise<
  ActionResult<{ completedCount: number; orderIds: string[] }>
> {
  await requireRole(["admin"], "/admin/transactions");
  const result = await autoCompleteExpiredShippedOrders(2);
  revalidatePath("/admin/transactions");
  revalidatePath("/dashboard/orders");
  revalidatePath("/order/success");
  revalidatePath("/profile");
  return ok(result);
}

const reviewSchema = z.object({
  orderId: z.string().optional(),
  listingId: z.string().min(1, "ID produk wajib diisi"),
  rating: z
    .number()
    .int("Rating harus berupa bilangan bulat")
    .min(1, "Rating minimal 1 bintang")
    .max(5, "Rating maksimal 5 bintang"),
  comment: z.string().max(500, "Ulasan maksimal 500 karakter").optional(),
  imageUrl: z
    .string()
    .max(500)
    .refine((val) => !val || isOwnedImageUrl(val), "URL gambar tidak valid")
    .optional()
    .nullable(),
});

export async function submitReviewAction(
  input: unknown,
): Promise<ActionResult<{ reviewId: string }>> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "Data ulasan tidak valid");
  }

  const session = await getSession();
  if (session.role === "guest" || !session.userId) {
    return fail("Silakan login untuk memberikan ulasan");
  }

  if (!parsed.data.orderId) {
    return fail("Ulasan hanya dapat diberikan dari pesanan yang sudah selesai");
  }

  const order = await getOrderById(parsed.data.orderId);
  if (!order || !order.buyerId || order.buyerId !== session.userId) {
    return fail("Anda hanya dapat mengulas produk dari pesanan Anda sendiri");
  }
  if (order.status !== "completed") {
    return fail("Ulasan hanya dapat diberikan setelah pesanan selesai diterima");
  }

  const containsListing = order.items?.length
    ? order.items.some((item) => item.listingId === parsed.data.listingId)
    : order.listingId === parsed.data.listingId;
  if (!containsListing) {
    return fail("Produk ini tidak ada dalam pesanan tersebut");
  }

  const existingReview = await getReviewByOrderAndListing(
    parsed.data.orderId,
    parsed.data.listingId,
  );
  if (existingReview) {
    return fail("Anda sudah memberikan ulasan untuk produk ini pada pesanan tersebut");
  }

  const buyerName = order.buyerName || "Pembeli Biji Hub";

  const review = await createReview({
    orderId: parsed.data.orderId,
    listingId: parsed.data.listingId,
    buyerId: session.userId,
    buyerName,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
    imageUrl: parsed.data.imageUrl,
  });

  try {
    revalidatePath("/orders");
    revalidatePath("/order/success");
    getListingById(parsed.data.listingId)
      .then((listing) => {
        if (listing?.slug) {
          try {
            revalidatePath(`/product/${listing.slug}`);
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {});
  } catch {
    // ignore: revalidatePath might throw outside Next.js request lifecycle (e.g. tests)
  }

  return ok({ reviewId: review.id });
}

export async function getShippingRatesAction(params: {
  originCity: string;
  originProvince?: string;
  destinationCity: string;
  destinationProvince?: string;
  weightGrams: number;
}): Promise<ActionResult<ShippingRate[]>> {
  const ip = await getClientIp();
  const rl = await checkRateLimit(`shipping_rates:${ip}`, 30, 60_000);
  if (!rl.success) {
    return fail("Terlalu banyak permintaan kalkulasi ongkir. Silakan tunggu 1 menit.");
  }

  try {
    const rates = await calculateShippingRates(params);
    return ok(rates);
  } catch {
    logger.warn("shipping.calculation_failed", { origin: params.originCity, dest: params.destinationCity });
    return fail("Gagal menghitung ongkos kirim");
  }
}

export async function trackShipmentAction(
  trackingNumber: string,
  courierCode?: string,
): Promise<ActionResult<WaybillTrackingResult>> {
  if (!trackingNumber || trackingNumber.trim().length < 3) {
    return fail("Nomor resi tidak valid");
  }

  const session = await getSession();
  if (session.role === "guest") {
    return fail("Silakan login untuk melacak resi pengiriman.");
  }

  const rl = await checkRateLimit(
    `track_shipment:${session.userId || session.email || "auth"}`,
    20,
    60_000,
  );
  if (!rl.success) {
    return fail("Terlalu banyak permintaan pelacakan resi. Silakan tunggu 1 menit.");
  }

  const result = await trackShipmentWaybill(trackingNumber.trim(), courierCode);
  return ok(result);
}

export async function cancelPendingOrderAction(
  orderId: string,
  accessToken?: string,
): Promise<ActionResult<{ success: boolean }>> {
  const session = await getSession();
  const order = await getOrderById(orderId);
  if (!order) return fail("Pesanan tidak ditemukan");

  if (order.status !== "pending_payment") {
    return fail("Hanya pesanan yang belum dibayar yang dapat dibatalkan");
  }

  if (!canAccessOrder(order, session, accessToken)) {
    return fail("Anda tidak memiliki akses untuk membatalkan pesanan ini");
  }

  await updateOrderStatus(order.id, "canceled");
  try {
    revalidatePath("/orders");
    revalidatePath("/profile");
    revalidatePath("/dashboard/orders");
  } catch {
    // ignore: test environment
  }
  return ok({ success: true });
}

export async function cancelPaidOrderAction(
  orderId: string,
  reason?: string,
  accessToken?: string,
): Promise<ActionResult<{ success: boolean; refundStatus: string; message?: string }>> {
  const session = await getSession();
  const order = await getOrderById(orderId);
  if (!order) return fail("Pesanan tidak ditemukan");

  if (order.status !== "paid") {
    return fail("Hanya pesanan yang sudah dibayar dan belum dikirim yang dapat diajukan pembatalan / refund");
  }

  const isBuyer = canAccessOrder(order, session, accessToken);
  const isSeller = session.sellerId && session.sellerId === order.sellerId;
  const isAdmin = session.role === "admin";

  if (!isBuyer && !isSeller && !isAdmin) {
    return fail("Anda tidak memiliki akses untuk membatalkan pesanan ini");
  }

  const cleanReason =
    (reason || "").trim() ||
    (isSeller
      ? "Dibatalkan oleh penjual (stok habis / kendala operasional)"
      : "Dibatalkan oleh pembeli sebelum pengiriman");

  // 1. Guard against duplicate refund
  const existingRefund = await getRefundByOrderId(order.id);
  if (existingRefund && (existingRefund.status === "processed" || existingRefund.status === "pending")) {
    return fail("Pengembalian dana untuk pesanan ini sedang diproses atau telah selesai.");
  }

  // 2. Outbox pattern (N1): Create pending refund record first with deterministic ID
  const refundId = `ref-${order.id}`;
  let refundRecord;
  try {
    refundRecord = await createRefundRecord({
      id: refundId,
      orderId: order.id,
      amount: order.totalAmount,
      reason: cleanReason,
      status: "pending",
      createdBy: session.userId || (isBuyer ? "buyer" : isSeller ? "seller" : "admin"),
    });
  } catch (e) {
    logger.error("order.refund_outbox_failed", e, { orderId: order.id });
    return fail("Gagal membuat catatan pengembalian dana");
  }

  // 3. Transition order status to canceled (restores stock)
  const transition = await transitionOrderStatus(order.id, "canceled");
  if (!transition.applied) {
    return fail("Gagal memperbarui status pesanan");
  }

  // 4. Request refund with deterministic key
  const provider = getPaymentProvider();
  const refundRes = await provider.refund(
    order.midtransOrderId || order.orderNumber,
    order.totalAmount,
    cleanReason,
    { refundKey: `refund-${refundRecord.id}` },
  );

  // 5. Update refund status
  await updateRefundStatus(refundRecord.id, {
    status: refundRes.status,
    providerRef: refundRes.providerRef,
    failureReason: refundRes.message || null,
    attempts: 1,
  });

  sendOrderRefundedEmail(order, {
    amount: order.totalAmount,
    reason: cleanReason,
    status: refundRes.status,
  }).catch((err) => {
    logger.warn("order.refund_email_failed", { orderId: order.id, error: String(err) });
  });

  try {
    revalidatePath("/orders");
    revalidatePath("/profile");
    revalidatePath("/dashboard/orders");
    revalidatePath("/admin/transactions");
    revalidatePath("/admin/refunds");
  } catch {
    // ignore: test environment
  }

  return ok({
    success: true,
    refundStatus: refundRes.status,
    message: refundRes.message,
  });
}

export async function resumeOrderPaymentAction(
  orderId: string,
  accessToken?: string,
): Promise<
  ActionResult<{
    snapToken: string | null;
    payment: {
      provider: "midtrans" | "mock";
      token: string | null;
    };
    orderNumber: string;
    totalAmount: number;
  }>
> {
  const session = await getSession();
  const order = await getOrderById(orderId);
  if (!order) return fail("Pesanan tidak ditemukan");

  if (!canAccessOrder(order, session, accessToken)) {
    return fail("Anda tidak memiliki akses ke pembayaran pesanan ini");
  }

  if (order.status !== "pending_payment") {
    return fail("Pesanan ini sudah diproses atau telah selesai");
  }

  const provider = getPaymentProvider();
  let snapToken = order.snapToken;
  if (!snapToken) {
    try {
      const paymentResult = await provider.createPayment({
        orderRef: order.midtransOrderId || order.orderNumber,
        amount: order.totalAmount,
        customer: {
          name: order.buyerName,
          email: order.buyerEmail,
          phone: order.buyerPhone,
        },
        items: (order.items || []).map((item) => ({
          id: item.listingId,
          name: item.title || "Produk",
          price: item.unitPrice,
          quantity: item.quantity,
        })),
      });
      if (paymentResult?.clientToken) {
        snapToken = paymentResult.clientToken;
        await updateOrderSnapToken(order.id, paymentResult.clientToken);
      }
    } catch {
      // ignore: optional operation fallback
      // offline / mock fallback
    }
  }

  return ok({
    snapToken: snapToken ?? null,
    payment: {
      provider: provider.id,
      token: snapToken ?? null,
    },
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount,
  });
}

export async function checkOrderPaymentStatusAction(
  orderIdOrNumber: string,
  accessToken?: string,
): Promise<ActionResult<{ status: string; isPaid: boolean }>> {
  const session = await getSession();
  const order = await getOrderById(orderIdOrNumber);
  if (!order) return fail("Pesanan tidak ditemukan");

  if (!canAccessOrder(order, session, accessToken)) {
    return fail("Anda tidak memiliki akses ke pesanan ini");
  }

  if (
    order.status === "paid" ||
    order.status === "shipped" ||
    order.status === "completed"
  ) {
    return ok({ status: order.status, isPaid: true });
  }

  const provider = getPaymentProvider();
  try {
    const statusResult = await provider.getStatus(
      order.midtransOrderId || order.orderNumber,
    );
    if (statusResult && statusResult.status === "paid") {
      const applied = await updateOrderStatus(order.id, "paid");
      if (applied) {
        sendOrderPaidEmail({ ...order, status: "paid" }).catch(() => {});
        getSellerById(order.sellerId)
          .then((seller) => {
            sendNewOrderSellerEmail({
              order: { ...order, status: "paid" },
              sellerEmail: seller?.user?.email,
              sellerName: seller?.businessName || order.sellerName,
            }).catch(() => {});
          })
          .catch(() => {});
      }

      revalidatePath("/order/success");
      revalidatePath("/profile");
      revalidatePath("/dashboard/orders");
      return ok({ status: "paid", isPaid: true });
    }
  } catch {
    // ignore: optional buyer profile sync to supabase
  }

  return ok({ status: order.status, isPaid: false });
}




