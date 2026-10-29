import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getSellerById } from "@/lib/data";
import { getUnreadNotificationCount } from "@/lib/data/notifications";
import { countActiveOrdersByBuyer } from "@/lib/data/orders";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        {
          authenticated: false,
          role: "guest" as const,
          user: null,
          storeName: null,
          activeOrdersCount: 0,
          unreadCount: 0,
        },
        { headers: { "Cache-Control": "private, no-store, max-age=0" } }
      );
    }

    // Parallel fetch: seller profile, active orders count, and notifications
    const [seller, activeOrdersCount, unreadCount] = await Promise.all([
      session.sellerId
        ? getSellerById(session.sellerId).catch((err) => {
            // ignore: seller profile may not exist yet or connection timed out
            logger.warn("me.get_seller_failed", { sellerId: session.sellerId, error: err });
            return null;
          })
        : Promise.resolve(null),
      countActiveOrdersByBuyer(session.userId).catch((err) => {
        // ignore: non-blocking order count calculation failure
        logger.warn("me.count_orders_failed", { userId: session.userId, error: err });
        return 0;
      }),
      getUnreadNotificationCount(session.userId).catch((err) => {
        // ignore: non-blocking notification count calculation failure
        logger.warn("me.count_notifications_failed", { userId: session.userId, error: err });
        return 0;
      }),
    ]);

    const firstName = session.name || session.email?.split("@")[0] || "User";

    return NextResponse.json(
      {
        authenticated: true,
        role: session.role || "buyer",
        user: {
          firstName,
          avatarUrl: undefined, // Avoid hotlinking Google avatars to protect buyer IP/privacy
        },
        storeName: seller?.businessName ?? null,
        activeOrdersCount,
        unreadCount,
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    );
  } catch (error) {
    logger.error("me.route_unhandled_failure", error);
    return NextResponse.json(
      {
        authenticated: false,
        role: "guest" as const,
        user: null,
        storeName: null,
        activeOrdersCount: 0,
        unreadCount: 0,
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    );
  }
}
