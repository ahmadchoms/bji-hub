import { NextRequest, NextResponse } from "next/server";
import { verifyMidtransSignature, mapMidtransStatus } from "@/lib/midtrans";
import { getPrisma } from "@/lib/data/prisma/client";
import { logger } from "@/lib/logger";

/**
 * Midtrans HTTP Notification Webhook Handler
 * Verifies SHA-512 signature and updates payment status accordingly.
 */
export async function POST(req: NextRequest) {
  let body: {
    order_id: string;
    status_code: string;
    gross_amount: string;
    signature_key?: string;
    transaction_status?: string;
    fraud_status?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 1. Signature Verification
  if (!verifyMidtransSignature(body)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 2. Check if it is a marketplace product order
  const { transitionOrderStatus, getOrderById } = await import("@/lib/data/orders");
  const nextStatus = mapMidtransStatus(
    body.transaction_status,
    body.fraud_status
  );
  const orderStatus =
    nextStatus === "paid"
      ? "paid"
      : nextStatus === "failed"
        ? "canceled"
        : "pending_payment";

  const order = await getOrderById(body.order_id);
  if (order) {
    const grossAmount = Math.round(Number(body.gross_amount));
    if (isNaN(grossAmount) || grossAmount !== Math.round(order.totalAmount)) {
      logger.error("Gross amount mismatch for order", undefined, { orderId: order.id, expected: order.totalAmount, got: body.gross_amount });
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
    where: { midtransOrderId: body.order_id },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const grossAmount = Math.round(Number(body.gross_amount));
  if (isNaN(grossAmount) || grossAmount !== Math.round(Number(payment.amount))) {
    logger.error("Gross amount mismatch for payment", undefined, { paymentId: payment.id, expected: payment.amount, got: body.gross_amount });
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  if (payment.status === "paid" && nextStatus !== "paid") {
    return NextResponse.json({ received: true, ignored: "Payment already settled" });
  }

  // 3. Process Subscription / Boost Payment
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: nextStatus,
        paidAt: nextStatus === "paid" ? new Date() : null,
      },
    });

    // If subscription payment succeeded, activate subscription
    if (nextStatus === "paid" && payment.subscriptionId) {
      await tx.subscription.update({
        where: { id: payment.subscriptionId },
        data: { status: "active" },
      });
    }

    // If boost payment succeeded, ensure listing is boosted
    if (nextStatus === "paid" && payment.listingId && payment.type === "boost") {
      await tx.listing.update({
        where: { id: payment.listingId },
        data: { isBoosted: true },
      });
    }
  });

  return NextResponse.json({ received: true });
}
