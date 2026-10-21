import { NextResponse } from "next/server";
import { checkMidtransStatus, mapMidtransStatus } from "@/lib/midtrans";
import { getPrisma } from "@/lib/data/prisma/client";

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

    const midtransRes = await checkMidtransStatus(pay.midtransOrderId);
    if (!midtransRes) continue;

    const nextStatus = mapMidtransStatus(
      midtransRes.transactionStatus,
      midtransRes.fraudStatus
    );

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

  return NextResponse.json({
    totalPending: pendingPayments.length,
    synced,
    timestamp: new Date().toISOString(),
  });
}
