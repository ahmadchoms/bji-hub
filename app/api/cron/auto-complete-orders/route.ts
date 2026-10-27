import { NextResponse } from "next/server";
import {
  autoCompleteExpiredShippedOrders,
  autoCancelExpiredPendingOrders,
} from "@/lib/data/orders";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Optional cron authorization header or secret check
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized: CRON_SECRET not configured" }, { status: 401 });
  }

  try {
    const [completed, canceled] = await Promise.all([
      autoCompleteExpiredShippedOrders(2),
      autoCancelExpiredPendingOrders(1.25),
    ]);
    logger.info("cron.finished", {
      cron: "auto-complete-orders",
      completedCount: completed.completedCount,
      canceledCount: canceled.canceledCount,
    });
    return NextResponse.json({
      success: true,
      message: `${completed.completedCount} pesanan selesai otomatis (>48 jam). ${canceled.canceledCount} pesanan belum bayar dibatalkan otomatis (>75 menit).`,
      completed,
      canceled,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal error",
      },
      { status: 500 },
    );
  }
}
