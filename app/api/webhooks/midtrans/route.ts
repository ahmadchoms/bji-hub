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

    const transitionRes = await transitionOrderStatus(order.id, orderStatus);
    if (!transitionRes.applied) {
      if (order.status === orderStatus) {
        return NextResponse.json({ received: true, ignored: "duplicate" });
      }
      return NextResponse.json({ received: true, ignored: "invalid_transition" });
    }

    if (orderStatus === "paid") {
      try {
        const { sendOrderPaidEmail, sendNewOrderSellerEmail } = await import("@/lib/email");
        sendOrderPaidEmail(order).catch((e) =>
          logger.error("Failed to send order paid email from webhook", e, { orderId: order.id })
        );

        const { getSellerById } = await import("@/lib/data");
        getSellerById(order.sellerId)
          .then((seller) => {
            sendNewOrderSellerEmail({
              order,
              sellerEmail: seller?.user?.email,
              sellerName: seller?.businessName || order.sellerName,
            }).catch((e) =>
              logger.error("Failed to send seller new order email from webhook", e, { orderId: order.id })
            );
          })
          .catch(() => {});
      } catch {
        // ignore: invalid webhook body JSON parsing
        // Non-blocking
      }
    }
    return NextResponse.json({ received: true, type: "order" });
  }

  if (process.env.DATA_SOURCE !== "prisma") {
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

  return NextResponse.json({ received: true });
}
