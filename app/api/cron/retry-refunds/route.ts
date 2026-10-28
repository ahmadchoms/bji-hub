import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { getOrderById } from "@/lib/data/orders";
import { getPendingOrFailedRefunds, updateRefundStatus } from "@/lib/data/refunds";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Automated Cron / Worker to retry failed or pending refunds.
 * Scans refund records where status IN ('pending', 'failed') AND attempts < 5.
 * Uses deterministic refundKey (refund-${refund.id}) to ensure idempotency with Midtrans.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Unauthorized: CRON_SECRET not configured" },
      { status: 401 },
    );
  }

  try {
    const pendingRefunds = await getPendingOrFailedRefunds(5);
    const provider = getPaymentProvider();
    const results = [];

    for (const ref of pendingRefunds) {
      const order = await getOrderById(ref.orderId);
      // M1: Guard against orphan refunds on non-canceled orders
      if (!order || order.status !== "canceled") {
        logger.error("refund.orphan_detected", undefined, {
          refundId: ref.id,
          orderId: ref.orderId,
          orderStatus: order?.status ?? "not_found",
        });
        await updateRefundStatus(ref.id, {
          status: "voided",
          failureReason: `Orphan refund detected: order status is '${order?.status ?? "not_found"}' (not canceled)`,
        });
        continue;
      }

      const nextAttempts = (ref.attempts || 0) + 1;

      try {
        const refundRes = await provider.refund(
          order.midtransOrderId || order.orderNumber,
          ref.amount,
          ref.reason,
          { refundKey: `refund-${ref.id}` },
        );

        let finalStatus = refundRes.status;
        if (finalStatus === "failed" && nextAttempts >= 5) {
          finalStatus = "manual_required";
          logger.error("refund.max_attempts_exceeded", {
            refundId: ref.id,
            orderId: ref.orderId,
            attempts: nextAttempts,
          });

          // A2: Alert admins about permanent failure requiring manual transfer
          const { notifyAdmins } = await import("@/lib/data/notifications");
          await notifyAdmins({
            title: "Refund Memerlukan Transfer Manual",
            message: `Refund ${ref.id} untuk order ${ref.orderId} telah melebihi batas percobaan otomatis (${nextAttempts}x). Harap lakukan transfer manual.`,
            type: "refund_action_required",
            link: "/admin/refunds",
          }).catch(() => {});
        }

        await updateRefundStatus(ref.id, {
          status: finalStatus,
          providerRef: refundRes.providerRef,
          failureReason: refundRes.message || null,
          attempts: nextAttempts,
        });

        results.push({
          refundId: ref.id,
          orderId: ref.orderId,
          attempts: nextAttempts,
          status: finalStatus,
          providerRef: refundRes.providerRef,
        });
      } catch (err) {
        logger.error("refund.retry_single_failed", err, { refundId: ref.id, orderId: ref.orderId });
        const finalStatus = nextAttempts >= 5 ? "manual_required" : "failed";
        await updateRefundStatus(ref.id, {
          status: finalStatus,
          failureReason: err instanceof Error ? err.message : String(err),
          attempts: nextAttempts,
        });
        results.push({
          refundId: ref.id,
          orderId: ref.orderId,
          attempts: nextAttempts,
          status: finalStatus,
          error: String(err),
        });
      }
    }

    logger.info("cron.finished", {
      cron: "retry-refunds",
      processedCount: results.length,
    });

    return NextResponse.json({
      success: true,
      processedCount: results.length,
      results,
    });
  } catch (error) {
    logger.error("cron.retry_refunds_error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal error",
      },
      { status: 500 },
    );
  }
}
