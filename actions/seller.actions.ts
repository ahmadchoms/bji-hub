"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
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
  requestVerification,
  updateListing,
  updateSellerProfile,
} from "@/lib/data";
import type { Payment } from "@/types";
import { findInvalidImageUrl } from "@/lib/storage";
import { decideBoostPayment, getBoostCredits } from "@/lib/boost-credits";
import { runAfterResponse } from "@/lib/after";
import { recordAuditLog } from "@/lib/data/audit-logs";
import { revalidateListing, revalidateStore } from "@/lib/cache/revalidate";
import { addRoastBatch } from "@/lib/coffee/roast-batch";
import { roastDateSchema } from "@/lib/validations/listing.schema";
import { logger } from "@/lib/logger";

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
  revalidateStore(seller.slug);
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
    if (
      existing &&
      parsed.data.roastDate &&
      existing.tasteProfile?.roastDate &&
      existing.tasteProfile.roastDate.split("T")[0] !== parsed.data.roastDate
    ) {
      const lastUpdated = (existing as { roastDateUpdatedAt?: string }).roastDateUpdatedAt
        ? new Date((existing as { roastDateUpdatedAt?: string }).roastDateUpdatedAt!).getTime()
        : 0;
      const hoursSinceLastChange = (Date.now() - lastUpdated) / (1000 * 60 * 60);
      if (lastUpdated > 0 && hoursSinceLastChange < 24) {
        return fail(
          "Tanggal sangrai hanya dapat diubah maksimal 1 kali per 24 jam demi menjaga keaslian data kesegaran",
        );
      }
      runAfterResponse(async () => {
        await recordAuditLog({
          actorId: sellerId,
          actorRole: "seller",
          action: "listing.roast_date_updated",
          targetType: "listing",
          targetId: listingId,
          details: {
            old: existing.tasteProfile?.roastDate,
            new: parsed.data.roastDate,
          },
        });
      });
    }

    const updated = await updateListing(sellerId, listingId, parsed.data);
    if (!updated) return fail("Listing tidak ditemukan");
    revalidatePath("/dashboard/listing");
    if (existing) {
      revalidateListing(existing.slug);
      if (updated.slug !== existing.slug) {
        revalidateListing(updated.slug);
      }
    }
    return ok({ id: updated.id });
  }

  const state = await getSellerPlanState(sellerId);
  const plan = getPlan(state.tier);

  const created = await createListing(sellerId, parsed.data, plan.maxListings);
  if (!created) {
    const stats = await getSellerStats(sellerId);
    if (stats.totalListings >= plan.maxListings) {
      return fail(
        `Batas ${plan.maxListings} listing paket ${plan.name} sudah tercapai`,
      );
    }
    return fail("Kategori tidak valid");
  }
  revalidatePath("/dashboard/listing");
  revalidateListing(created.slug);
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
  if (charge.amount > 0) {
    const { getPaymentProvider } = await import("@/lib/payments");
    const provider = getPaymentProvider();
    const paymentRes = await provider.createPayment({
      orderRef: payment.midtransOrderId,
      amount: charge.amount,
      customer: { name: "Seller", email: "seller@bijihub.com" },
      items: [],
    });
    snapToken = paymentRes?.clientToken ?? null;
  }

  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard/listing");
  revalidatePath("/dashboard/analytics");
  revalidatePath("/");
  return ok({ paymentId: payment.id, status: payment.status, snapToken });
}

const kycRequestSchema = z
  .object({
    kycDocumentPath: z.string().min(1).max(500).optional(),
  })
  .optional();

export async function requestVerificationAction(
  input?: unknown,
): Promise<ActionResult> {
  const { sellerId } = await requireSeller("/dashboard/verification");
  const parsed = kycRequestSchema.safeParse(input);
  const kycDocumentPath = parsed.success ? parsed.data?.kycDocumentPath : undefined;

  // M7: Ensure submitted KYC document path strictly belongs to the authenticated seller
  if (kycDocumentPath) {
    const kycPathRegex = new RegExp(
      `^(?:seller-kyc/)?uploads/${sellerId}/[0-9a-fA-F-]{36}\\.(?:jpg|jpeg|png|webp|pdf)$`,
    );
    if (!kycPathRegex.test(kycDocumentPath)) {
      return fail("Dokumen identitas tidak valid atau bukan milik toko Anda.");
    }
  }

  const success = await requestVerification(sellerId, kycDocumentPath);
  if (!success) return fail("Gagal mengajukan verifikasi toko");

  // A2: Notify admins about new KYC verification request
  const { runAfterResponse } = await import("@/lib/after");
  runAfterResponse(async () => {
    const { notifyAdmins } = await import("@/lib/data/notifications");
    await notifyAdmins({
      title: "Pengajuan Verifikasi KYC Baru",
      message: `Toko (ID: ${sellerId}) telah mengajukan verifikasi dokumen KYC.`,
      type: "kyc_verification",
      link: "/admin/verification",
      // ignore: non-blocking admin notification failure
    }).catch(() => {});
  });

  revalidatePath("/dashboard/verification");
  revalidatePath("/dashboard");
  revalidatePath("/admin/verification");
  return ok(undefined);
}

export async function quickUpdateStockAction(
  listingId: string,
  newStock: number,
): Promise<ActionResult<{ stock: number }>> {
  const { sellerId } = await requireSeller("/dashboard/listing");
  if (!Number.isInteger(newStock) || newStock < 0 || newStock > 1_000_000) {
    return fail("Jumlah kuantitas stok tidak valid");
  }

  const existing = await getListingById(listingId);
  if (!existing || existing.sellerId !== sellerId) {
    return fail("Listing tidak ditemukan atau Anda tidak memiliki akses");
  }

  const shouldActivate = newStock > 0 && existing.status === "archived";

  if (process.env.DATA_SOURCE !== "mock") {
    try {
      const { getPrisma } = await import("@/lib/data/prisma/client");
      const prisma = getPrisma();
      await prisma.listing.update({
        where: { id: listingId },
        data: {
          stock: newStock,
          ...(shouldActivate ? { status: "active" } : {}),
        },
      });
    } catch (e) {
      console.error("Failed to update stock in database:", e);
      return fail("Gagal memperbarui stok produk");
    }
  } else {
    const { mockListings } = await import("@/lib/mock/data");
    const target = mockListings.find((l) => l.id === listingId);
    if (target) {
      target.stock = newStock;
      if (shouldActivate) {
        target.status = "active";
      }
    }
  }

  revalidatePath("/dashboard/listing");
  revalidateListing(existing.slug);
  return ok({ stock: newStock });
}

export async function toggleListingStatusAction(
  listingId: string,
  newStatus: "active" | "archived",
): Promise<ActionResult<{ status: string }>> {
  const { sellerId } = await requireSeller("/dashboard/listing");
  const existing = await getListingById(listingId);
  if (!existing || existing.sellerId !== sellerId) {
    return fail("Listing tidak ditemukan atau Anda tidak memiliki akses");
  }
  if (existing.status === "suspended") {
    return fail("Produk yang ditangguhkan admin tidak dapat diubah statusnya");
  }

  if (process.env.DATA_SOURCE !== "mock") {
    try {
      const { getPrisma } = await import("@/lib/data/prisma/client");
      const prisma = getPrisma();
      await prisma.listing.update({
        where: { id: listingId },
        data: { status: newStatus },
      });
    } catch (e) {
      console.error("Failed to update listing status in database:", e);
      return fail("Gagal memperbarui status listing");
    }
  } else {
    const { mockListings } = await import("@/lib/mock/data");
    const target = mockListings.find((l) => l.id === listingId);
    if (target) {
      target.status = newStatus;
    }
  }

  revalidatePath("/dashboard/listing");
  revalidateListing(existing.slug);
  return ok({ status: newStatus });
}

const addRoastBatchSchema = z.object({
  listingId: z.string().min(1, "ID listing wajib diisi"),
  roastedOn: roastDateSchema,
  quantityKg: z.number().positive("Kuantitas harus positif").max(10_000, "Maksimal 10.000 kg").optional().nullable(),
  notes: z.string().max(500, "Catatan maksimal 500 karakter").optional().nullable(),
  nextRoastDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid").optional().nullable(),
});

export async function addRoastBatchAction(
  input: unknown,
): Promise<ActionResult<{ batchId: string; roastDate: string }>> {
  const { sellerId, session } = await requireSeller("/dashboard/listing");
  const parsed = addRoastBatchSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      "Data batch sangrai tidak valid",
      parsed.error.flatten().fieldErrors as FieldErrors,
    );
  }

  const { listingId, roastedOn, quantityKg, notes, nextRoastDate } = parsed.data;
  const listing = await getListingById(listingId);
  if (!listing || listing.sellerId !== sellerId) {
    return fail("Produk tidak ditemukan atau bukan milik toko Anda.");
  }

  try {
    const batch = await addRoastBatch({
      listingId,
      roastedOn,
      quantityKg: quantityKg ?? null,
      notes: notes ?? null,
      listingTitle: listing.title,
      listingSlug: listing.slug,
    });

    if (nextRoastDate !== undefined) {
      if (process.env.DATA_SOURCE !== "mock") {
        const { getPrisma } = await import("@/lib/data/prisma/client");
        await getPrisma().listing.update({
          where: { id: listingId },
          data: { nextRoastDate: nextRoastDate ? new Date(nextRoastDate) : null },
        });
      } else {
        const { mockListings } = await import("@/lib/mock/data");
        const target = mockListings.find((l) => l.id === listingId);
        if (target) {
          target.nextRoastDate = nextRoastDate ?? undefined;
        }
      }
    }

    runAfterResponse(async () => {
      await recordAuditLog({
        actorId: session.userId || sellerId,
        actorRole: "seller",
        action: "roast_batch_created",
        targetId: batch.id,
        details: { listingId, roastedOn, quantityKg },
      });
    });

    revalidateListing(listing.slug);
    try {
      revalidatePath("/dashboard/listing");
    } catch {
      // ignore outside request lifecycle
    }
    return ok({ batchId: batch.id, roastDate: batch.roastedOn });
  } catch (error) {
    logger.error("seller.add_roast_batch_failed", error);
    return fail("Gagal menambahkan batch sangrai.");
  }
}
