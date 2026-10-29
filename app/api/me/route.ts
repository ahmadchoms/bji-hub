import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getSellerById } from "@/lib/data";
import { getUnreadNotificationCount } from "@/lib/data/notifications";
import { getOrdersByBuyer } from "@/lib/data/orders";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        {
          authenticated: false,
          role: "buyer" as const,
          user: null,
          storeName: null,
          activeOrdersCount: 0,
          unreadCount: 0,
        },
        { headers: { "Cache-Control": "private, no-store, max-age=0" } }
      );
    }

    let storeName: string | null = null;
    if (session.sellerId) {
      try {
        const seller = await getSellerById(session.sellerId);
        if (seller) storeName = seller.businessName;
      } catch {
        // ignore
      }
    }

    let userName = session.email?.split("@")[0] || "User";
    let userAvatarUrl = "";

    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          userName =
            ((user.user_metadata?.name ||
              user.user_metadata?.full_name ||
              user.email?.split("@")[0]) as string) || userName;
          userAvatarUrl = (user.user_metadata?.avatar_url as string) || "";
        }
      } catch {
        // ignore
      }
    }

    let activeOrdersCount = 0;
    try {
      const orders = await getOrdersByBuyer(session.userId);
      activeOrdersCount = orders.filter(
        (o) => o.status === "paid" || o.status === "shipped"
      ).length;
    } catch {
      // ignore
    }

    let unreadCount = 0;
    try {
      unreadCount = await getUnreadNotificationCount(session.userId);
    } catch {
      // ignore
    }

    return NextResponse.json(
      {
        authenticated: true,
        role: session.role || "buyer",
        user: {
          firstName: userName,
          avatarUrl: userAvatarUrl || undefined,
        },
        storeName,
        activeOrdersCount,
        unreadCount,
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    );
  } catch {
    return NextResponse.json(
      {
        authenticated: false,
        role: "buyer" as const,
        user: null,
        storeName: null,
        activeOrdersCount: 0,
        unreadCount: 0,
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    );
  }
}
