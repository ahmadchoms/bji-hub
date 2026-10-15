"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getListingBySlug, getListingById, getSellerById } from "@/lib/data";
import {
  createOrder,
  getOrderById,
  updateOrderStatus,
  autoCompleteExpiredShippedOrders,
} from "@/lib/data/orders";
import { createReview } from "@/lib/data/reviews";
import { createMidtransSnapToken } from "@/lib/midtrans";
import { getSession, requireRole } from "@/lib/auth/session";
import { trackShipmentWaybill, type WaybillTrackingResult } from "@/lib/shipping";
import {
  sendOrderPaidEmail,
  sendOrderShippedEmail,
  sendNewOrderSellerEmail,
} from "@/lib/email";

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
  shippingCourier: z.string().min(1, "Kurir pengiriman wajib dipilih"),
  shippingCost: z.number().min(0, "Ongkos kirim tidak valid"),
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
    totalAmount: number;
  }>
> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      "Data pesanan tidak valid",
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const {
    listingId,
    quantity,
    buyerName,
    buyerEmail,
    buyerPhone,
    buyerAddress,
    buyerCity,
    shippingCourier,
    shippingCost,
    grindSize,
    notes,
    items,
  } = parsed.data;

  // 1. Fetch primary listing details
  const listing =
    (await getListingById(listingId)) || (await getListingBySlug(listingId));
  if (!listing) {
    return fail("Produk tidak ditemukan atau sudah tidak tersedia");
  }

  // Stock check guard
  if (listing.stock === 0) {
    return fail(`Maaf, stok untuk "${listing.title}" telah habis terjual`);
  }

  // 2. Compute items breakdown (multi-item vs single item)
  let subtotal = 0;
  let totalQuantity = quantity;
  let itemPrice = Number(listing.price);
  let multiItemSummary = "";

  if (items && items.length > 0) {
    let computedSubtotal = 0;
    let computedTotalQty = 0;
    const summaryList: string[] = [];

    for (const item of items) {
      const itemListing =
        (await getListingById(item.listingId)) || (await getListingBySlug(item.listingId));
      if (!itemListing) {
        return fail(`Salah satu produk dalam pesanan tidak ditemukan (${item.listingId})`);
      }
      if (itemListing.stock === 0) {
        return fail(`Maaf, stok untuk "${itemListing.title}" telah habis terjual`);
      }
      if (itemListing.stock !== undefined && item.quantity > itemListing.stock) {
        return fail(
          `Pesanan untuk "${itemListing.title}" (${item.quantity}) melebihi stok yang tersedia (${itemListing.stock} ${itemListing.unit})`,
        );
      }
      if (item.quantity < itemListing.minOrderQty) {
        return fail(
          `Minimal pemesanan untuk ${itemListing.title} adalah ${itemListing.minOrderQty} ${itemListing.unit}`,
        );
      }
      computedSubtotal += Number(itemListing.price) * item.quantity;
      computedTotalQty += item.quantity;
      const grindNote = item.grindSize ? ` [${item.grindSize}]` : "";
      summaryList.push(
        `${itemListing.title}${grindNote} (${item.quantity} ${itemListing.unit})`,
      );
    }

    subtotal = computedSubtotal;
    totalQuantity = computedTotalQty;
    itemPrice = Math.round(subtotal / Math.max(1, totalQuantity));
    if (summaryList.length > 1) {
      multiItemSummary = `[Paket Pesanan: ${summaryList.join(", ")}]`;
    }
  } else {
    if (listing.stock !== undefined && quantity > listing.stock) {
      return fail(
        `Pesanan (${quantity}) melebihi stok yang tersedia (${listing.stock} ${listing.unit})`,
      );
    }
    if (quantity < listing.minOrderQty) {
      return fail(
        `Minimal pemesanan untuk produk ini adalah ${listing.minOrderQty} ${listing.unit}`,
      );
    }
    subtotal = itemPrice * quantity;
  }

  const serviceFee = 1500; // Biaya layanan platform Biji Hub
  const totalAmount = subtotal + shippingCost + serviceFee;
  const singleItemGrind = !items && grindSize ? `[Gilingan: ${grindSize}]` : "";
  const combinedNotes = [multiItemSummary || singleItemGrind, notes]
    .filter(Boolean)
    .join(" ");

  const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(
    100 + Math.random() * 900,
  )}`;
  const midtransOrderId = orderNumber;

  // 3. Request Snap Token from Midtrans
  let snapToken: string | null = null;
  try {
    snapToken = await createMidtransSnapToken({
      orderId: midtransOrderId,
      grossAmount: totalAmount,
      customerName: buyerName,
      customerEmail: buyerEmail,
    });
  } catch {
    // If offline / sandbox mock
  }

  const session = await getSession();
  const buyerId = session.role === "buyer" ? (session as unknown as { userId?: string }).userId ?? null : null;

  // 4. Save order to database
  const order = await createOrder({
    orderNumber,
    buyerId,
    buyerName,
    buyerEmail,
    buyerPhone,
    buyerAddress,
    buyerCity,
    sellerId: listing.sellerId,
    listingId: listing.id,
    quantity: totalQuantity,
    itemPrice,
    subtotal,
    shippingCost,
    serviceFee,
    totalAmount,
    shippingCourier,
    snapToken,
    midtransOrderId,
    notes: combinedNotes || null,
  });

  // 5. Cloud Sync: Automatically sync the buyer's shipping address to their cloud profile & session
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
      // ignore
    }
  }

  try {
    const cookieStore = await cookies();
    cookieStore.set(
      "biji-buyer-profile",
      JSON.stringify({
        name: buyerName.trim(),
        phone: buyerPhone.trim(),
        address: buyerAddress.trim(),
        city: buyerCity.trim(),
      }),
      { path: "/", httpOnly: true, maxAge: 60 * 60 * 24 * 30 },
    );
  } catch {
    // ignore
  }

  return ok({
    orderId: order.id,
    orderNumber: order.orderNumber,
    snapToken,
    totalAmount,
  });
}

export async function confirmOrderPaymentAction(
  orderIdOrNumber: string,
): Promise<ActionResult<{ success: boolean }>> {
  const order = await getOrderById(orderIdOrNumber);
  if (!order) return fail("Pesanan tidak ditemukan");

  await updateOrderStatus(order.id, "paid");
  sendOrderPaidEmail({ ...order, status: "paid" }).catch((err) =>
    console.error("Failed to send paid email:", err),
  );

  getSellerById(order.sellerId)
    .then((seller) => {
      sendNewOrderSellerEmail({
        order: { ...order, status: "paid" },
        sellerEmail: seller?.user?.email,
        sellerName: seller?.businessName || order.sellerName,
      }).catch((err) =>
        console.error("Failed to send seller new order email:", err),
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

  const order = await getOrderById(orderId);
  if (!order) return fail("Pesanan tidak ditemukan");

  const cleanResi = trackingNumber.trim();
  await updateOrderStatus(order.id, "shipped", cleanResi);
  sendOrderShippedEmail({
    ...order,
    status: "shipped",
    trackingNumber: cleanResi,
  }).catch((err) => console.error("Failed to send shipped email:", err));

  return ok({ success: true });
}

export async function completeOrderAction(
  orderId: string,
): Promise<ActionResult<{ success: boolean }>> {
  const order = await getOrderById(orderId);
  if (!order) return fail("Pesanan tidak ditemukan");

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
  evidenceUrl: z.string().optional().nullable(),
});

export async function disputeOrderAction(
  input: unknown,
): Promise<ActionResult<{ success: boolean }>> {
  const parsed = disputeSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Data komplain tidak valid", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const order = await getOrderById(parsed.data.orderId);
  if (!order) return fail("Pesanan tidak ditemukan");

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
  await requireRole(["admin"], "/admin/transactions");

  const order = await getOrderById(orderId);
  if (!order) return fail("Pesanan tidak ditemukan");

  const newStatus = decision === "complete" ? "completed" : "canceled";
  await updateOrderStatus(order.id, newStatus);

  revalidatePath("/order/success");
  revalidatePath("/profile");
  revalidatePath("/dashboard/orders");
  revalidatePath("/admin/transactions");

  return ok({ success: true });
}

export async function sellerResolveDisputeAction(
  orderId: string,
  resolution: "refund" | "reship",
  newTrackingNumber?: string,
): Promise<ActionResult<{ success: boolean }>> {
  const session = await getSession();
  const sellerId = (session as unknown as { sellerId?: string }).sellerId;
  const order = await getOrderById(orderId);
  if (!order) return fail("Pesanan tidak ditemukan");

  if (session.role !== "admin" && (!sellerId || order.sellerId !== sellerId)) {
    return fail("Anda tidak memiliki akses untuk menyelesaikan komplain pesanan ini");
  }

  if (order.status !== "disputed") {
    return fail("Pesanan tidak sedang dalam status komplain");
  }

  if (resolution === "refund") {
    await updateOrderStatus(order.id, "canceled");
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
    }).catch((err) => console.error("Failed to send reship email:", err));
  }

  revalidatePath("/order/success");
  revalidatePath("/profile");
  revalidatePath("/dashboard/orders");
  revalidatePath("/admin/transactions");

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
  listingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
  imageUrl: z.string().optional().nullable(),
});

export async function submitReviewAction(
  input: unknown,
): Promise<ActionResult<{ reviewId: string }>> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Data ulasan tidak valid");
  }

  const session = await getSession();
  const buyerId = session.role === "buyer" ? (session as unknown as { userId?: string }).userId ?? null : null;

  let buyerName = "Pembeli Biji Hub";
  if (parsed.data.orderId) {
    const order = await getOrderById(parsed.data.orderId);
    if (order?.buyerName) buyerName = order.buyerName;
  }

  const review = await createReview({
    orderId: parsed.data.orderId,
    listingId: parsed.data.listingId,
    buyerId,
    buyerName,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
    imageUrl: parsed.data.imageUrl,
  });

  revalidatePath("/orders");
  revalidatePath("/order/success");
  getListingById(parsed.data.listingId)
    .then((listing) => {
      if (listing?.slug) {
        revalidatePath(`/product/${listing.slug}`);
      }
    })
    .catch(() => {});

  return ok({ reviewId: review.id });
}

export async function trackShipmentAction(
  trackingNumber: string,
  courierCode?: string,
): Promise<ActionResult<WaybillTrackingResult>> {
  if (!trackingNumber || trackingNumber.trim().length < 3) {
    return fail("Nomor resi tidak valid");
  }

  const result = await trackShipmentWaybill(trackingNumber.trim(), courierCode);
  return ok(result);
}

export async function cancelPendingOrderAction(
  orderId: string,
): Promise<ActionResult<{ success: boolean }>> {
  const session = await getSession();
  const order = await getOrderById(orderId);
  if (!order) return fail("Pesanan tidak ditemukan");

  if (order.status !== "pending_payment") {
    return fail("Hanya pesanan yang belum dibayar yang dapat dibatalkan");
  }

  if (session.role === "guest") {
    return fail("Silakan login untuk membatalkan pesanan ini");
  }

  await updateOrderStatus(order.id, "canceled");
  revalidatePath("/orders");
  revalidatePath("/profile");
  revalidatePath("/dashboard/orders");
  return ok({ success: true });
}

export async function resumeOrderPaymentAction(
  orderId: string,
): Promise<
  ActionResult<{
    snapToken: string | null;
    orderNumber: string;
    totalAmount: number;
  }>
> {
  const order = await getOrderById(orderId);
  if (!order) return fail("Pesanan tidak ditemukan");

  if (order.status !== "pending_payment") {
    return fail("Pesanan ini sudah diproses atau telah selesai");
  }

  let snapToken = order.snapToken;
  if (!snapToken) {
    try {
      snapToken = await createMidtransSnapToken({
        orderId: order.midtransOrderId || order.orderNumber,
        grossAmount: order.totalAmount,
        customerName: order.buyerName,
        customerEmail: order.buyerEmail,
      });
    } catch {
      // offline / mock fallback
    }
  }

  return ok({
    snapToken: snapToken ?? null,
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount,
  });
}


