import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Store } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { PageContainer } from "@/components/layout/page-container";
import { BuyerOrdersCard } from "@/components/profile/buyer-orders-card";
import { getOrdersByBuyer } from "@/lib/data/orders";

export const metadata: Metadata = {
  title: "Riwayat Pesanan - Biji Hub",
  description: "Pantau status pengiriman, bukti resi, dan riwayat pesanan kopi Anda.",
};

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await getSession();

  if (session.role === "guest" || !session.userId) {
    redirect("/login?next=/orders");
  }

  const orders = await getOrdersByBuyer(session.userId);

  return (
    <div className="py-8 md:py-12 bg-neutral-50/50 min-h-[80vh]">
      <PageContainer className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold font-display text-neutral-900">
              Riwayat Pesanan Saya
            </h1>
            <p className="text-xs text-neutral-600 mt-0.5">
              Pantau status pesanan, verifikasi pembayaran, dan nomor resi pengiriman Anda.
            </p>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold text-primary-700 hover:text-primary-800 self-start sm:self-auto"
          >
            Beli Kopi Lagi →
          </Link>
        </div>

        {session.sellerId && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Ini riwayat belanja pribadi Anda. Ingin mengelola pesanan masuk dari pembeli toko Anda?</span>
            </div>
            <Link
              href="/dashboard/orders"
              className="font-bold underline text-amber-800 hover:text-amber-950 shrink-0 sm:ml-2"
            >
              Kelola Pesanan Toko Masuk →
            </Link>
          </div>
        )}

        <BuyerOrdersCard orders={orders} />
      </PageContainer>
    </div>
  );
}
