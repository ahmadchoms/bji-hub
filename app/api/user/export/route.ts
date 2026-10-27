import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getUserAddresses } from "@/lib/data/addresses";
import { getOrdersByBuyer } from "@/lib/data/orders";
import { getReviewsByBuyer } from "@/lib/data/reviews";

export async function GET() {
  const session = await getSession();
  if (session.role === "guest" || !session.userId) {
    return NextResponse.json(
      { error: "Sesi tidak valid atau belum login." },
      { status: 401 },
    );
  }

  const [addresses, orders, reviews] = await Promise.all([
    getUserAddresses(session.userId),
    getOrdersByBuyer(session.userId, session.email ?? undefined),
    getReviewsByBuyer(session.userId),
  ]);

  const exportData = {
    metadata: {
      platform: "Biji Hub Specialty Coffee Marketplace",
      exportedAt: new Date().toISOString(),
      regulation: "UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)",
    },
    user: {
      id: session.userId,
      email: session.email,
      role: session.role,
    },
    addresses,
    orders,
    reviews,
  };

  const filename = `data-pribadi-${session.userId.slice(0, 8)}-${Date.now()}.json`;

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
