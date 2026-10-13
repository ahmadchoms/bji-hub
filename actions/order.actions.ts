"use server";

import { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getListingBySlug, getListingById } from "@/lib/data";
import { createOrder, getOrderById, updateOrderStatus } from "@/lib/data/orders";
import { createMidtransSnapToken } from "@/lib/midtrans";
import { getSession } from "@/lib/auth/session";

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
  notes: z.string().max(300).optional(),
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
    notes,
  } = parsed.data;

  // 1. Fetch listing details
  const listing =
    (await getListingById(listingId)) || (await getListingBySlug(listingId));
  if (!listing) {
    return fail("Produk tidak ditemukan atau sudah tidak tersedia");
  }

  if (quantity < listing.minOrderQty) {
    return fail(
      `Minimal pemesanan untuk produk ini adalah ${listing.minOrderQty} ${listing.unit}`,
    );
  }

  // 2. Compute financial breakdown
  const itemPrice = Number(listing.price);
  const subtotal = itemPrice * quantity;
  const serviceFee = 1500; // Biaya layanan platform Biji Hub
  const totalAmount = subtotal + shippingCost + serviceFee;

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
    quantity,
    itemPrice,
    subtotal,
    shippingCost,
    serviceFee,
    totalAmount,
    shippingCourier,
    snapToken,
    midtransOrderId,
    notes,
  });

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

  await updateOrderStatus(order.id, "shipped", trackingNumber.trim());
  return ok({ success: true });
}

export async function completeOrderAction(
  orderId: string,
): Promise<ActionResult<{ success: boolean }>> {
  const order = await getOrderById(orderId);
  if (!order) return fail("Pesanan tidak ditemukan");

  await updateOrderStatus(order.id, "completed");
  return ok({ success: true });
}
