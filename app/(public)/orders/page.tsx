import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { PageContainer } from "@/components/layout/page-container";
import { BuyerOrdersCard } from "@/components/profile/buyer-orders-card";
import { getOrdersByBuyer } from "@/lib/data/orders";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Riwayat Pesanan - Biji Hub",
  description: "Pantau status pengiriman, bukti resi, dan riwayat pesanan kopi Anda.",
};

export default async function OrdersPage() {
  const session = await getSession();

  if (session.role === "guest") {
    redirect("/login?next=/orders");
  }

  if (session.role === "seller") {
    redirect("/dashboard/orders");
  }

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
      if (user?.email) {
        userEmail = user.email;
      }
    } catch {
      // ignore
    }
  }

  if (!userEmail) {
    userEmail = "pembeli@bijihub.com";
  }

  const orders = await getOrdersByBuyer(userEmail);

  return (
    <div className="py-8 md:py-12 bg-neutral-50/50 min-h-[80vh]">
      <PageContainer className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold font-display text-neutral-900">
              Riwayat Pesanan Saya
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Pantau status pesanan, pembayaran rekening escrow, dan nomor resi pengiriman Anda.
            </p>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold text-primary-700 hover:text-primary-800 self-start sm:self-auto"
          >
            Beli Kopi Lagi →
          </Link>
        </div>

        <BuyerOrdersCard orders={orders} />
      </PageContainer>
    </div>
  );
}
