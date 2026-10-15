import { NavbarInner } from "@/components/layout/navbar-inner";
import { getSession } from "@/lib/auth/session";
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
      // ignore
    }
  }

  if (!userName && session.role !== "guest") {
    try {
      const cookieStore = await cookies();
      const raw = cookieStore.get("biji-buyer-profile")?.value;
      if (raw) {
        const parsed = JSON.parse(raw);
        userName = parsed.name || "";
        userAvatarUrl = parsed.avatarUrl || "";
        userEmail = parsed.email || userEmail;
      }
    } catch {
      // ignore
    }
  }

  if (!userName && session.role !== "guest") {
    userName = session.role === "seller" ? "Penjual" : "Akbar Hakim";
  }

  if (!userEmail && session.role === "buyer") {
    userEmail = "pembeli@bijihub.com";
  }

  let activeOrdersCount = 0;
  if (session.role !== "guest") {
    try {
      const buyerOrders = await getOrdersByBuyer(
        userEmail || "pembeli@bijihub.com",
        session.userId,
      );
      activeOrdersCount = buyerOrders.filter((o) =>
        ["pending_payment", "paid", "shipped", "disputed"].includes(o.status),
      ).length;
    } catch {
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
