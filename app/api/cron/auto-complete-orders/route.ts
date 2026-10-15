import { NextResponse } from "next/server";
import {
  autoCompleteExpiredShippedOrders,
  autoCancelExpiredPendingOrders,
} from "@/lib/data/orders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Optional cron authorization header or secret check
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [completed, canceled] = await Promise.all([
      autoCompleteExpiredShippedOrders(2),
      autoCancelExpiredPendingOrders(24),
    ]);
    return NextResponse.json({
      success: true,
      message: `${completed.completedCount} pesanan selesai otomatis (>48 jam). ${canceled.canceledCount} pesanan belum bayar dibatalkan otomatis (>24 jam).`,
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
