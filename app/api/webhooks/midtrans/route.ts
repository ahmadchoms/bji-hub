import { NextRequest, NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { getPrisma } from "@/lib/data/prisma/client";
import { logger } from "@/lib/logger";

/**
 * Midtrans HTTP Notification Webhook Handler
 * Verifies signature and updates payment status accordingly.
 */
export async function POST(req: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    // ignore: invalid webhook body reading
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const provider = getPaymentProvider();
  const parsed = await provider.parseWebhook(rawBody);

  // 1. Signature Verification
  if (!parsed) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Handle Midtrans Dashboard "Test Notification" Ping
  if (parsed.orderRef.startsWith("payment_notif_test")) {
    return NextResponse.json({ received: true, mode: "test_notification" });
  }

  // 1b. S5 & M2: Webhook Replay & Idempotency Check
  const { createHash } = await import("crypto");
  const eventId = createHash("sha256").update(rawBody).digest("hex");
  const { isWebhookEventProcessed, recordWebhookEvent } = await import("@/lib/data/webhook-events");
  if (await isWebhookEventProcessed(eventId)) {
    logger.info("webhook.duplicate_skipped", { orderRef: parsed.orderRef, eventId });
    return NextResponse.json({ received: true, ignored: "already_processed" });
  }

  // 2. Check if it is a marketplace product order
  const { transitionOrderStatus, getOrderById } = await import("@/lib/data/orders");
  const orderStatus =
    parsed.status === "paid"
      ? "paid"
      : parsed.status === "pending"
        ? "pending_payment"
        : "canceled";

  const order = await getOrderById(parsed.orderRef);
  if (order) {
    if (parsed.amount === null || Math.round(parsed.amount) !== Math.round(order.totalAmount)) {
      logger.error("Gross amount mismatch for order", undefined, {
        orderId: order.id,
        expected: order.totalAmount,
        got: parsed.amount,
      });
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    // M3: Late payment on canceled order
    if (order.status === "canceled" && orderStatus === "paid") {
      logger.error("payment.late_on_canceled", undefined, {
        orderId: order.id,
        orderRef: parsed.orderRef,
      });

      const { createRefundRecord } = await import("@/lib/data/refunds");
      await createRefundRecord({
        id: `ref-late-${order.id}`,
        orderId: order.id,
        amount: order.totalAmount,
        reason: "Pembayaran diterima setelah pesanan dibatalkan (late payment)",
        status: "manual_required",
        createdBy: "system_midtrans_webhook",
      });

      // A1/A2: Run background notifications after response
      const { runAfterResponse } = await import("@/lib/after");
      runAfterResponse(async () => {
        if (order.buyerId) {
          try {
            const { createNotification } = await import("@/lib/data/notifications");
            await createNotification({
              userId: order.buyerId,
              title: "Pembayaran Diterima untuk Pesanan Dibatalkan",
              message: `Pembayaran pesanan ${order.orderNumber} diterima setelah pesanan dibatalkan. Pengembalian dana akan diproses secara manual oleh admin.`,
              type: "refund",
              link: "/orders",
            });
          } catch (e) {
            logger.error("notification.buyer_late_payment_failed", e, { orderId: order.id });
          }
        }

        try {
          const { notifyAdmins } = await import("@/lib/data/notifications");
          await notifyAdmins({
            title: "Pembayaran Terlambat",
            message: `Order ${order.orderNumber} dibayar setelah dibatalkan. Perlu pengembalian dana manual.`,
            type: "late_payment",
            link: "/admin/refunds",
          });
        } catch (e) {
          logger.error("notification.admin_late_payment_failed", e, { orderId: order.id });
        }
      });

      await recordWebhookEvent(eventId, "midtrans", parsed.orderRef);
      return NextResponse.json({ received: true, action: "late_payment_refund_queued" });
    }

    const transitionRes = await transitionOrderStatus(order.id, orderStatus);
    if (!transitionRes.applied) {
      if (order.status === orderStatus) {
        await recordWebhookEvent(eventId, "midtrans", parsed.orderRef);
        return NextResponse.json({ received: true, ignored: "duplicate" });
      }
      return NextResponse.json({ received: true, ignored: "invalid_transition" });
    }

    try {
      const { revalidateListing } = await import("@/lib/cache/revalidate");
      revalidateListing(null);
    } catch {
      // ignore outside request lifecycle
    }

    if (orderStatus === "paid") {
      const { runAfterResponse } = await import("@/lib/after");
      runAfterResponse(async () => {
        const { sendOrderPaidEmail, sendNewOrderSellerEmail } = await import("@/lib/email");
        await sendOrderPaidEmail(order).catch((e) =>
          logger.error("email.order_paid_failed", e, { orderId: order.id })
        );

        try {
          const { getSellerById } = await import("@/lib/data");
          const seller = await getSellerById(order.sellerId);
          if (seller) {
            await sendNewOrderSellerEmail({
              order,
              sellerEmail: seller?.user?.email,
              sellerName: seller?.businessName || order.sellerName,
            }).catch((e) =>
              logger.error("email.seller_new_order_failed", e, { orderId: order.id })
            );
          }
        } catch (e) {
          logger.error("seller.lookup_failed_for_email", e, { sellerId: order.sellerId });
        }

        const { createNotification, notifySeller } = await import("@/lib/data/notifications");
        if (order.buyerId) {
          await createNotification({
            userId: order.buyerId,
            title: "Pembayaran Dikonfirmasi",
            message: `Pembayaran pesanan ${order.orderNumber} telah diterima dan sedang diproses penjual.`,
            type: "order_status",
            link: "/orders",
          }).catch((e) => logger.error("notification.buyer_confirm_failed", e, { orderId: order.id }));
        }
        if (order.sellerId) {
          await notifySeller(order.sellerId, {
            title: "Pesanan Baru Masuk",
            message: `Ada pesanan baru ${order.orderNumber}. Segera proses dan kirimkan pesanan.`,
            type: "order_status",
            link: "/dashboard/orders",
          }).catch((e) => logger.error("notification.seller_new_order_failed", e, { orderId: order.id }));
        }
      });
    }

    // Record event as successfully completed
    await recordWebhookEvent(eventId, "midtrans", parsed.orderRef);
    return NextResponse.json({ received: true, type: "order" });
  }

  if (process.env.DATA_SOURCE !== "prisma") {
    await recordWebhookEvent(eventId, "midtrans", parsed.orderRef);
    return NextResponse.json({ received: true, mode: "mock" });
  }

  const prisma = getPrisma();
  const payment = await prisma.payment.findUnique({
    where: { midtransOrderId: parsed.orderRef },
  });

  if (!payment) {
    logger.warn("Webhook received for unknown order or payment", { orderRef: parsed.orderRef });
    return NextResponse.json({ received: true, ignored: "not_found" });
  }

  if (parsed.amount === null || Math.round(parsed.amount) !== Math.round(Number(payment.amount))) {
    logger.error("Gross amount mismatch for payment", undefined, {
      paymentId: payment.id,
      expected: payment.amount,
      got: parsed.amount,
    });
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  const nextPaymentStatus =
    parsed.status === "paid"
      ? "paid"
      : parsed.status === "pending"
        ? "pending"
        : "failed";

  if (payment.status === "paid" && nextPaymentStatus !== "paid") {
    return NextResponse.json({ received: true, ignored: "Payment already settled" });
  }

  // 3. Process Subscription / Boost Payment
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: nextPaymentStatus,
        paidAt: nextPaymentStatus === "paid" ? new Date() : null,
      },
    });

    // If subscription payment succeeded, activate subscription
    if (nextPaymentStatus === "paid" && payment.subscriptionId) {
      await tx.subscription.update({
        where: { id: payment.subscriptionId },
        data: { status: "active" },
      });
    }

    // If boost payment succeeded, ensure listing is boosted
    if (nextPaymentStatus === "paid" && payment.listingId && payment.type === "boost") {
      await tx.listing.update({
        where: { id: payment.listingId },
        data: { isBoosted: true },
      });
    }
  });

  await recordWebhookEvent(eventId, "midtrans", parsed.orderRef);
  return NextResponse.json({ received: true });
}
