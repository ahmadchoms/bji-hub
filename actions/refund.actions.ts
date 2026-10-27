"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getPaymentProvider } from "@/lib/payments";
import { getOrderById } from "@/lib/data/orders";
import {
  getAllRefunds,
  updateRefundStatus,
  type RefundRecord,
} from "@/lib/data/refunds";
import { recordAuditLog } from "@/lib/data/audit-logs";
import { getClientIp } from "@/lib/client-ip";
import { logger } from "@/lib/logger";

export async function getAdminRefundsAction(): Promise<ActionResult<RefundRecord[]>> {
  await requireRole(["admin"], "/admin/refunds");
  try {
    const list = await getAllRefunds();
    return ok(list);
  } catch (err) {
    logger.error("admin.get_refunds_failed", err);
    return fail("Gagal memuat daftar pengembalian dana");
  }
}

export async function retryRefundAction(
  refundId: string,
): Promise<ActionResult<{ success: boolean; status: string; message?: string }>> {
  const session = await requireRole(["admin"], "/admin/refunds");

  const all = await getAllRefunds();
  const refund = all.find((r) => r.id === refundId);
  if (!refund) return fail("Catatan pengembalian dana tidak ditemukan");

  const order = await getOrderById(refund.orderId);
  if (!order) return fail("Pesanan terkait tidak ditemukan");

  const nextAttempts = (refund.attempts || 0) + 1;
  const provider = getPaymentProvider();

  try {
    const refundRes = await provider.refund(
      order.midtransOrderId || order.orderNumber,
      refund.amount,
      refund.reason,
      { refundKey: `refund-${refund.id}` },
    );

    await updateRefundStatus(refund.id, {
      status: refundRes.status,
      providerRef: refundRes.providerRef,
      failureReason: refundRes.message || null,
      attempts: nextAttempts,
      resolvedBy: refundRes.status === "processed" ? session.userId : undefined,
    });

    const ip = await getClientIp();
    await recordAuditLog({
      actorId: session.userId || "admin",
      actorRole: session.role,
      action: "retry_refund",
      targetId: refundId,
      targetType: "refund",
      details: { status: refundRes.status, providerRef: refundRes.providerRef },
      ipAddress: ip,
    });

    if (refundRes.status === "failed" || refundRes.status === "manual_required") {
      const { createNotification } = await import("@/lib/data/notifications");
      createNotification({
        userId: session.userId || "admin",
        title: "Refund Gateway Gagal",
        message: `Refund untuk pesanan ${order.orderNumber} gagal diproses otomatis. Diperlukan transfer manual.`,
        type: "refund",
        link: "/admin/refunds",
      }).catch(() => {});
    }

    try {
      revalidatePath("/admin/refunds");
      revalidatePath("/admin/transactions");
    } catch {
      // ignore
    }

    return ok({
      success: refundRes.success,
      status: refundRes.status,
      message: refundRes.message,
    });
  } catch (err) {
    logger.error("admin.retry_refund_failed", err, { refundId });
    await updateRefundStatus(refund.id, {
      status: "failed",
      failureReason: err instanceof Error ? err.message : String(err),
      attempts: nextAttempts,
    });
    return fail("Gagal memproses ulang pengembalian dana");
  }
}

export async function resolveManualRefundAction(
  refundId: string,
  notes?: string,
): Promise<ActionResult<{ success: boolean }>> {
  const session = await requireRole(["admin"], "/admin/refunds");

  const all = await getAllRefunds();
  const refund = all.find((r) => r.id === refundId);
  if (!refund) return fail("Catatan pengembalian dana tidak ditemukan");

  try {
    const cleanNotes = (notes || "").trim();
    await updateRefundStatus(refund.id, {
      status: "processed",
      resolvedBy: session.userId || "admin",
      failureReason: cleanNotes ? `Ditransfer manual: ${cleanNotes}` : "Ditransfer manual oleh admin",
    });

    const ip = await getClientIp();
    await recordAuditLog({
      actorId: session.userId || "admin",
      actorRole: session.role,
      action: "manual_refund_resolve",
      targetId: refundId,
      targetType: "refund",
      details: { notes: cleanNotes },
      ipAddress: ip,
    });

    try {
      revalidatePath("/admin/refunds");
      revalidatePath("/admin/transactions");
    } catch {
      // ignore
    }

    return ok({ success: true });
  } catch (err) {
    logger.error("admin.resolve_manual_refund_failed", err, { refundId });
    return fail("Gagal memperbarui status pengembalian dana manual");
  }
}
