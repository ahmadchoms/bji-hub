"use server";

import { logger } from "@/lib/logger";

import { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getSession } from "@/lib/auth/session";
import { createImageUploadTarget } from "@/lib/data";
import {
  IMAGE_RULES,
  isAllowedImageType,
  KYC_DOCUMENT_RULES,
  isAllowedKycType,
} from "@/lib/storage";
import { checkRateLimit } from "@/lib/rate-limit";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSellerById } from "@/lib/data";

const uploadRequestSchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z
    .string()
    .refine(isAllowedImageType, "Format harus JPG, PNG, atau WebP"),
  size: z
    .number()
    .int()
    .min(1)
    .max(IMAGE_RULES.maxBytes, "Ukuran maksimal 2 MB"),
});

export interface UploadTargetData {
  uploadUrl: string;
  publicUrl: string;
  path: string;
}

/** Step 1 of a direct-to-storage upload: client PUTs or uploads directly to cloud storage. */
export async function createImageUploadAction(
  input: unknown,
): Promise<ActionResult<UploadTargetData>> {
  const session = await getSession();
  if (session.role === "guest" || (!session.sellerId && !session.userId)) {
    return fail("Silakan login untuk mengunggah gambar");
  }

  const uploaderId = session.sellerId ?? session.userId ?? "uploads";

  const rate = await checkRateLimit("upload:" + uploaderId, 20, 60_000);
  if (!rate.success) {
    return fail("Terlalu banyak unggahan file. Silakan tunggu sebentar.");
  }

  const parsed = uploadRequestSchema.safeParse(input);
  if (!parsed.success)
    return fail(parsed.error.issues[0]?.message ?? "File tidak valid");

  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const ext = extMap[parsed.data.contentType] || "webp";

  // Supabase Storage Cloud Upload when Service Role Key is configured
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    try {
      const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const filePath = `uploads/${uploaderId}/${crypto.randomUUID()}.${ext}`;

      const { data: signedData, error } = await supabase.storage
        .from("listings")
        .createSignedUploadUrl(filePath);

      if (!error && signedData) {
        const { data: publicUrlData } = supabase.storage
          .from("listings")
          .getPublicUrl(filePath);

        return ok({
          uploadUrl: signedData.signedUrl,
          publicUrl: publicUrlData.publicUrl,
          path: filePath,
        });
      }
    } catch (err) {
      // ignore: Fall through to mock storage target if Supabase bucket/service fails in dev
      logger.warn("upload.storage_bucket_fallback", { message: (err as Error)?.message });
    }
  }

  // Mock storage target fallback (local dev & testing)
  const target = createImageUploadTarget({
    sellerId: uploaderId,
    contentType: parsed.data.contentType,
    size: parsed.data.size,
  });
  if (!target) return fail("File tidak dapat diunggah");
  return ok(target);
}

const kycUploadRequestSchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z
    .string()
    .refine(isAllowedKycType, "Format harus JPG, PNG, WebP, atau PDF"),
  size: z
    .number()
    .int()
    .min(1)
    .max(KYC_DOCUMENT_RULES.maxBytes, "Ukuran dokumen maksimal 5 MB"),
});

export interface KycUploadTargetData {
  uploadUrl: string;
  path: string;
}

/** Step 1 of private KYC document upload: returns signed upload URL to private bucket (S6/F10). */
export async function createKycUploadTargetAction(
  input: unknown,
): Promise<ActionResult<KycUploadTargetData>> {
  const session = await getSession();
  if (session.role !== "seller" || !session.sellerId) {
    return fail("Hanya akun penjual yang dapat mengunggah dokumen KYC");
  }

  const sellerId = session.sellerId;
  const rate = await checkRateLimit("upload:kyc:" + sellerId, 10, 60_000);
  if (!rate.success) {
    return fail("Terlalu banyak permintaan unggah KYC. Silakan tunggu sebentar.");
  }

  const parsed = kycUploadRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dokumen tidak valid");
  }

  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
  };
  const ext = extMap[parsed.data.contentType] || "pdf";
  const filePath = `uploads/${sellerId}/${crypto.randomUUID()}.${ext}`;

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    try {
      const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
      );

      const { data: signedData, error } = await supabase.storage
        .from("seller-kyc")
        .createSignedUploadUrl(filePath);

      if (!error && signedData) {
        return ok({
          uploadUrl: signedData.signedUrl,
          path: filePath,
        });
      }
    } catch (err) {
      logger.warn("upload.kyc_storage_fallback", { message: (err as Error)?.message });
    }
  }

  // M7/M9: In production mode, do not fall back to mock storage
  if (process.env.DATA_SOURCE !== "mock") {
    return fail("Layanan penyimpanan dokumen KYC sedang mengalami kendala. Silakan coba lagi nanti.");
  }

  return ok({
    uploadUrl: `/api/mock-storage/kyc-${crypto.randomUUID()}`,
    path: `seller-kyc/${filePath}`,
  });
}

/** Generates a short-lived signed download URL (max 5 minutes) for viewing private KYC document (S6/F10). */
export async function getKycDocumentSignedUrlAction(
  sellerId: string,
): Promise<ActionResult<{ signedUrl: string; expiresAt: number }>> {
  const session = await getSession();
  const isAdmin = session.role === "admin";
  const isOwner = session.role === "seller" && session.sellerId === sellerId;

  if (!isAdmin && !isOwner) {
    return fail("Akses tidak diizinkan. Hanya pemilik toko dan admin yang dapat melihat dokumen KYC.");
  }

  const seller = await getSellerById(sellerId);
  if (!seller || !seller.kycDocumentUrl) {
    return fail("Dokumen identitas KYC belum diunggah");
  }

  const expiresInSeconds = 300; // 5 minutes max as mandated by S6
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  const cleanPath = seller.kycDocumentUrl.replace(/^seller-kyc\//, "");

  // M7: Audit trail whenever an admin views a seller's private KYC document
  if (isAdmin) {
    const { recordAuditLog } = await import("@/lib/data/audit-logs");
    const { getClientIp } = await import("@/lib/client-ip");
    const ip = await getClientIp();
    await recordAuditLog({
      actorId: session.userId || "admin",
      actorRole: session.role,
      action: "view_kyc_document",
      targetId: sellerId,
      targetType: "seller",
      details: { path: cleanPath },
      ipAddress: ip,
    });
  }

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    try {
      const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
      );

      const { data, error } = await supabase.storage
        .from("seller-kyc")
        .createSignedUrl(cleanPath, expiresInSeconds);

      if (!error && data?.signedUrl) {
        return ok({
          signedUrl: data.signedUrl,
          expiresAt,
        });
      }
    } catch (err) {
      logger.warn("upload.kyc_signed_url_fallback", { message: (err as Error)?.message });
    }
  }

  return ok({
    signedUrl: `/api/mock-storage/${encodeURIComponent(seller.kycDocumentUrl)}?signed=1&expires=${expiresAt}`,
    expiresAt,
  });
}
