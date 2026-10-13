import { NextResponse } from "next/server";
import { autoCompleteExpiredShippedOrders } from "@/lib/data/orders";

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
    const result = await autoCompleteExpiredShippedOrders(7);
    return NextResponse.json({
      success: true,
      message: `${result.completedCount} pesanan kadaluwarsa (>7 hari) berhasil diselesaikan otomatis.`,
      ...result,
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
