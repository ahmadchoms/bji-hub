import { NextRequest, NextResponse } from "next/server";
import { verifyMidtransSignature } from "@/lib/midtrans";
import { getPrisma } from "@/lib/data/prisma/client";

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

  // 2. Map Midtrans transaction_status
  const isSuccess =
    body.transaction_status === "settlement" ||
    (body.transaction_status === "capture" && body.fraud_status === "accept");

  const isFailed =
    body.transaction_status === "cancel" ||
    body.transaction_status === "deny" ||
    body.transaction_status === "expire";

  const nextStatus = isSuccess ? "paid" : isFailed ? "failed" : "pending";

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
