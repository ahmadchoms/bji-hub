import { NavbarInner } from "@/components/layout/navbar-inner";
import { getSession } from "@/lib/auth/session";
import { readBuyerProfileCookie } from "@/lib/auth/buyer-profile";
import { getCategories, getSellerById } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { getOrdersByBuyer } from "@/lib/data/orders";
import { cookies } from "next/headers";

export async function Navbar() {
  const session = await getSession();
  const categories = await getCategories();

  let storeName: string | null = null;
  if (session.sellerId) {
    try {
      const seller = await getSellerById(session.sellerId);
      if (seller) {
        storeName = seller.businessName;
      }
    } catch {
      // ignore: optional session/cookie fallback in navbar
      // ignore
    }
  }

  let userName = "";
  let userAvatarUrl = "";
  let userEmail = "";

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
        userEmail = user.email || "";
        userName =
          ((user.user_metadata?.name ||
            user.user_metadata?.full_name ||
            user.email?.split("@")[0]) as string) || "";
        userAvatarUrl = (user.user_metadata?.avatar_url as string) || "";
      }
    } catch {
      // ignore: optional session/cookie fallback in navbar
      // ignore
    }
  }

  if (!userName && session.role !== "guest") {
    try {
      const cookieStore = await cookies();
      const profile = readBuyerProfileCookie(cookieStore);
      userName = profile.name || "";
      userAvatarUrl = profile.avatarUrl || "";
    } catch {
      // ignore: optional session/cookie fallback in navbar
      // ignore
    }
  }

  if (!userName && session.role !== "guest") {
    userName = session.role === "seller" ? "Penjual" : "Akbar Hakim";
  }

  let activeOrdersCount = 0;
  if (session.role !== "guest" && session.userId) {
    try {
      const buyerOrders = await getOrdersByBuyer(session.userId);
      activeOrdersCount = buyerOrders.filter((o) =>
        ["pending_payment", "paid", "shipped", "disputed"].includes(o.status),
      ).length;
    } catch {
      // ignore: optional session/cookie fallback in navbar
      // ignore
    }
  }

  const firstName = userName ? userName.trim().split(/\s+/)[0] : "";

  return (
    <NavbarInner
      role={session.role}
      categories={categories}
      user={
        session.role !== "guest" && firstName
          ? { firstName, avatarUrl: userAvatarUrl }
          : null
      }
      storeName={storeName}
      activeOrdersCount={activeOrdersCount}
    />
  );
}
