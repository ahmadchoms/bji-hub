import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { getPrisma } from "@/lib/data/prisma/client";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Automated Cron / Worker to reconcile pending Midtrans payments.
 * Scans pending payments created within the last 24h and updates their statuses.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized: CRON_SECRET not configured" }, { status: 401 });
  }

  if (process.env.DATA_SOURCE !== "prisma") {
    return NextResponse.json({ synced: 0, mode: "mock" });
  }

  const prisma = getPrisma();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const provider = getPaymentProvider();
  const pendingPayments = await prisma.payment.findMany({
    where: {
      status: "pending",
      createdAt: { gte: oneDayAgo },
    },
    take: 50,
  });

  let synced = 0;

  for (const pay of pendingPayments) {
    if (!pay.midtransOrderId || pay.midtransOrderId.startsWith("MOCK-")) {
      continue;
    }

    const statusResult = await provider.getStatus(pay.midtransOrderId);
    if (!statusResult) continue;

    const nextStatus =
      statusResult.status === "paid"
        ? "paid"
        : statusResult.status === "failed" ||
            statusResult.status === "canceled" ||
            statusResult.status === "expired"
          ? "failed"
          : "pending";

    if (nextStatus !== "pending") {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: pay.id },
          data: {
            status: nextStatus,
            paidAt: nextStatus === "paid" ? new Date() : null,
          },
        });

        if (nextStatus === "paid" && pay.subscriptionId) {
          await tx.subscription.update({
            where: { id: pay.subscriptionId },
            data: { status: "active" },
          });
        }

        if (nextStatus === "paid" && pay.listingId && pay.type === "boost") {
          await tx.listing.update({
            where: { id: pay.listingId },
            data: { isBoosted: true },
          });
        }
      });
      synced++;
    }
  }

  logger.info("cron.finished", {
    cron: "sync-payments",
    totalPending: pendingPayments.length,
    synced,
  });

  return NextResponse.json({
    totalPending: pendingPayments.length,
    synced,
    timestamp: new Date().toISOString(),
  });
}
