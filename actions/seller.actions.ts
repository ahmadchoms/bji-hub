"use server";

import { revalidatePath } from "next/cache";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { requireSeller } from "@/lib/auth/session";
import { isActiveBoost } from "@/lib/boost";
import { BOOST_OPTIONS, getPlan } from "@/lib/plans";
import { boostSchema } from "@/lib/validations/boost.schema";
import { listingSchema } from "@/lib/validations/listing.schema";
import { sellerProfileSchema } from "@/lib/validations/seller-profile.schema";
import {
  activateBoost,
  createListing,
  getListingById,
  getSellerPayments,
  getSellerPlanState,
  getSellerStats,
  updateListing,
  updateSellerProfile,
} from "@/lib/data";
import type { Payment } from "@/types";
import { findInvalidImageUrl } from "@/lib/storage";
import { decideBoostPayment, getBoostCredits } from "@/lib/boost-credits";

type FieldErrors = Record<string, string[]>;

export async function updateProfileAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const { sellerId } = await requireSeller("/dashboard/profile");
  const parsed = sellerProfileSchema.safeParse(input);
  if (!parsed.success)
    return fail(
      "Data tidak valid",
      parsed.error.flatten().fieldErrors as FieldErrors,
    );

  const seller = await updateSellerProfile(sellerId, parsed.data);
  if (!seller) return fail("Profil toko tidak ditemukan");

  revalidatePath("/dashboard/profile");
  revalidatePath(`/store/${seller.slug}`);
  return ok({ id: seller.id });
}

export async function saveListingAction(
  input: unknown,
  listingId?: string,
): Promise<ActionResult<{ id: string }>> {
  const { sellerId } = await requireSeller("/dashboard/listing");
  const parsed = listingSchema.safeParse(input);
  if (!parsed.success)
    return fail(
      "Data tidak valid",
      parsed.error.flatten().fieldErrors as FieldErrors,
    );

  const existing = listingId ? await getListingById(listingId) : null;
  if (listingId && (!existing || existing.sellerId !== sellerId)) {
    return fail("Listing tidak ditemukan atau Anda tidak memiliki akses");
  }

  const existingUrls = new Set(
    existing ? existing.images.map((i) => i.url) : [],
  );

  if (findInvalidImageUrl(parsed.data.images, existingUrls)) {
    return fail("Foto tidak valid", {
      images: ["Gunakan foto yang diunggah lewat form ini"],
    });
  }

  if (listingId) {
    const updated = await updateListing(sellerId, listingId, parsed.data);
    if (!updated) return fail("Listing tidak ditemukan");
    revalidatePath("/dashboard/listing");
    revalidatePath(`/product/${updated.slug}`);
    revalidatePath("/");
    return ok({ id: updated.id });
  }

  const [state, stats] = await Promise.all([
    getSellerPlanState(sellerId),
    getSellerStats(sellerId),
  ]);
  const plan = getPlan(state.tier);
  if (stats.totalListings >= plan.maxListings) {
    return fail(
      `Batas ${plan.maxListings} listing paket ${plan.name} sudah tercapai`,
    );
  }

  const created = await createListing(sellerId, parsed.data);
  if (!created) return fail("Kategori tidak valid");
  revalidatePath("/dashboard/listing");
  revalidatePath("/");
  return ok({ id: created.id });
}

export async function purchaseBoostAction(
  input: unknown,
): Promise<
  ActionResult<{
    paymentId: string;
    status: Payment["status"];
    snapToken?: string | null;
  }>
> {
  const { sellerId } = await requireSeller("/dashboard/billing");
  const parsed = boostSchema.safeParse(input);
  if (!parsed.success)
    return fail(
      "Data tidak valid",
      parsed.error.flatten().fieldErrors as FieldErrors,
    );

  const option = BOOST_OPTIONS.find((o) => o.value === parsed.data.duration);
  const listing = await getListingById(parsed.data.listingId);
  if (!option || !listing || listing.sellerId !== sellerId)
    return fail("Listing tidak ditemukan");
  if (listing.status !== "active")
    return fail("Hanya listing aktif yang bisa di-boost");
  if (isActiveBoost(listing))
    return fail("Listing ini masih memiliki boost aktif");

  const [planState, payments] = await Promise.all([
    getSellerPlanState(sellerId),
    getSellerPayments(sellerId),
  ]);
  const credits = getBoostCredits(getPlan(planState.tier), payments);
  const charge = decideBoostPayment({
    useCredit: parsed.data.useCredit,
    option,
    credits,
  });
  if (!charge.ok) return fail(charge.reason);

  const payment = await activateBoost(
    sellerId,
    listing.id,
    option.days,
    charge.amount,
  );
  if (!payment) return fail("Gagal memproses boost");

  let snapToken: string | null = null;
  if (charge.amount > 0 && process.env.MIDTRANS_SERVER_KEY) {
    const { createMidtransSnapToken } = await import("@/lib/midtrans");
    snapToken = await createMidtransSnapToken({
      orderId: payment.midtransOrderId,
      grossAmount: charge.amount,
    });
  }

  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard/listing");
  revalidatePath("/dashboard/analytics");
  revalidatePath("/");
  return ok({ paymentId: payment.id, status: payment.status, snapToken });
}
