"use server";

import { getSession } from "@/lib/auth/session";
import { getOrderById } from "@/lib/data/orders";
import { getListingById } from "@/lib/data";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { logger } from "@/lib/logger";

export interface ReorderResult {
  listingId: string;
  listingSlug: string;
  title: string;
  grindSize?: string | null;
  unitPrice: number;
  quantity: number;
  unit?: string;
}

export async function reorderCompletedItemAction(
  orderId: string,
  targetListingId?: string
): Promise<ActionResult<ReorderResult>> {
  try {
    const session = await getSession();
    if (!session || !session.userId || session.role === "guest") {
      return fail("Silakan masuk akun terlebih dahulu untuk memesan kembali.");
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return fail("Pesanan tidak ditemukan.");
    }

    // Enforce data ownership rule #5
    if (order.buyerId !== session.userId) {
      return fail("Akses ditolak: Anda tidak memiliki akses ke pesanan ini.");
    }

    const items = order.items || [];
    const item = targetListingId
      ? items.find((i) => i.listingId === targetListingId)
      : items[0];

    const listingId = item?.listingId || order.listingId;
    if (!listingId) {
      return fail("Produk dalam pesanan tidak valid.");
    }

    const listing = await getListingById(listingId);
    if (!listing || listing.status !== "active") {
      return fail("Produk ini sedang tidak tersedia atau diarsipkan oleh penjual.");
    }

    if (listing.stock !== undefined && listing.stock <= 0) {
      return fail("Stok produk ini sedang habis.");
    }

    const qty = Math.max(1, listing.minOrderQty || 1);

    return ok({
      listingId: listing.id,
      listingSlug: listing.slug,
      title: listing.title,
      grindSize: item?.grindSize || null,
      unitPrice: listing.price,
      quantity: qty,
      unit: listing.unit,
    });
  } catch (error) {
    logger.error("Gagal melakukan Beli Lagi", error);
    return fail("Terjadi kesalahan saat memproses pesanan ulang.");
  }
}
