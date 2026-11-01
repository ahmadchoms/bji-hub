"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getSession, requireSeller } from "@/lib/auth/session";
import { isAdminAllowed } from "@/lib/auth/admin-guard";
import { replyToReview, reportReview, voteReviewHelpful, adminApproveReview } from "@/lib/data/reviews";
import { recordAuditLog } from "@/lib/data/audit-logs";
import { getClientIp } from "@/lib/client-ip";
import { checkRateLimit } from "@/lib/rate-limit";
import { runAfterResponse } from "@/lib/after";
import { revalidateListing } from "@/lib/cache/revalidate";

const replySchema = z.object({
  reviewId: z.string().min(1, "ID ulasan wajib diisi"),
  reply: z.string().trim().min(2, "Balasan minimal 2 karakter").max(500, "Balasan maksimal 500 karakter"),
});

export async function replyToReviewAction(
  input: unknown,
): Promise<ActionResult<{ success: boolean }>> {
  const { sellerId } = await requireSeller();

  const parsed = replySchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "Data balasan tidak valid");
  }

  const success = await replyToReview(
    parsed.data.reviewId,
    sellerId,
    parsed.data.reply,
  );
  if (!success) {
    return fail(
      "Ulasan tidak ditemukan, sudah dibalas sebelumnya, atau Anda tidak memiliki akses ke ulasan produk ini.",
    );
  }

  revalidatePath("/product");
  revalidateListing(null);
  revalidateListing(null);
  return ok({ success: true });
}

export async function voteReviewHelpfulAction(
  reviewId: string,
): Promise<ActionResult<{ voteCount: number; userVoted: boolean }>> {
  const session = await getSession();
  if (session.role === "guest" || !session.userId) {
    return fail("Silakan masuk akun terlebih dahulu untuk menyukai ulasan.");
  }

  const res = await voteReviewHelpful(reviewId, session.userId);
  if (!res.success) {
    return fail("Gagal mencatat dukungan ulasan");
  }

  return ok({ voteCount: res.voteCount, userVoted: res.userVoted });
}

export async function adminApproveReviewAction(
  reviewId: string,
): Promise<ActionResult<{ success: boolean }>> {
  const session = await getSession();
  if (!(await isAdminAllowed(session))) {
    return fail("Hanya admin terverifikasi MFA yang dapat memoderasi ulasan.");
  }

  const success = await adminApproveReview(reviewId);
  if (!success) {
    return fail("Gagal menyetujui ulasan atau ulasan tidak ditemukan");
  }

  revalidateListing(null);
  revalidatePath("/admin/reviews");
  return ok({ success: true });
}

export async function adminHideReviewAction(
  reviewId: string,
): Promise<ActionResult<{ success: boolean }>> {
  const session = await getSession();
  if (!(await isAdminAllowed(session))) {
    return fail("Hanya admin terverifikasi MFA yang dapat memoderasi ulasan.");
  }

  const { getPool } = await import("@/lib/db/pool");
  const pool = getPool();
  if (pool) {
    await pool.query(
      `UPDATE public.reviews SET moderation_status = 'rejected', is_reported = true WHERE id = $1`,
      [reviewId],
    );
  }

  revalidateListing(null);
  revalidatePath("/admin/reviews");
  return ok({ success: true });
}

const reportSchema = z.object({
  reviewId: z.string().min(1, "ID ulasan wajib diisi"),
  reason: z
    .string()
    .trim()
    .min(5, "Alasan pelaporan minimal 5 karakter")
    .max(500, "Alasan pelaporan maksimal 500 karakter"),
});

export async function reportReviewAction(
  input: unknown,
): Promise<ActionResult<{ success: boolean }>> {
  const session = await getSession();
  if (session.role === "guest" || !session.userId) {
    return fail("Silakan masuk terlebih dahulu untuk melaporkan ulasan.");
  }

  const rate = await checkRateLimit("report_review:" + session.userId, 10, 60 * 60_000);
  if (!rate.success) {
    return fail("Terlalu banyak pelaporan ulasan dalam waktu singkat. Silakan tunggu sebentar.");
  }

  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "Alasan pelaporan tidak valid");
  }

  try {
    const success = await reportReview(
      parsed.data.reviewId,
      session.userId,
      parsed.data.reason,
    );
    if (!success) {
      return fail("Ulasan tidak ditemukan atau gagal dilaporkan.");
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal melaporkan ulasan.";
    if (
      msg.includes("Akun Anda harus berumur") ||
      msg.includes("minimal 1 pesanan selesai") ||
      msg.includes("Akun pelapor tidak ditemukan")
    ) {
      return fail("Akun Anda belum memenuhi syarat melaporkan ulasan.");
    }
    return fail(msg);
  }

  const actorId = session.userId;
  const actorRole = session.role;
  const reviewId = parsed.data.reviewId;
  const reason = parsed.data.reason;

  runAfterResponse(async () => {
    const clientIp = await getClientIp();
    await recordAuditLog({
      actorId,
      actorRole,
      action: "report_review",
      targetId: reviewId,
      targetType: "review",
      details: { reason },
      ipAddress: clientIp,
    });
  });

  revalidateListing(null);
  return ok({ success: true });
}
