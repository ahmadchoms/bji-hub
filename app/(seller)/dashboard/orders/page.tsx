import { requireSeller } from "@/lib/auth/session";
import { getOrdersBySeller } from "@/lib/data/orders";
import {
  getSellerBalanceSummary,
  getSellerBankDetails,
  getPayoutRequestsBySeller,
} from "@/lib/data/payouts";
import { SectionHeader } from "@/components/shared/section-header";
import { SellerOrderList } from "@/components/dashboard/seller-order-list";
import { SellerFinanceSection } from "@/components/dashboard/seller-finance-section";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Truck, CheckCircle2, Clock } from "lucide-react";

export const metadata = {
  title: "Pesanan Masuk & Saldo - Biji Hub Seller",
  description: "Kelola pesanan pembeli, saldo escrow, dan penarikan dana ke rekening bank.",
};

export default async function DashboardOrdersPage() {
  const { sellerId } = await requireSeller();

  const [orders, balanceSummary, bankDetails, payoutHistory] = await Promise.all([
    getOrdersBySeller(sellerId),
    getSellerBalanceSummary(sellerId),
    getSellerBankDetails(sellerId),
    getPayoutRequestsBySeller(sellerId),
  ]);

  const pendingCount = orders.filter((o) => o.status === "pending_payment").length;
  const paidCount = orders.filter((o) => o.status === "paid").length;
  const shippedCount = orders.filter((o) => o.status === "shipped").length;
  const completedCount = orders.filter((o) => o.status === "completed").length;

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Pesanan Masuk & Keuangan"
        subtitle="Kelola pesanan pembeli, input resi, dan pantau pencairan saldo rekening escrow Anda."
      />

      {/* Saldo Escrow & Penarikan Dana Section */}
      <SellerFinanceSection
        balanceSummary={balanceSummary}
        bankDetails={bankDetails}
        payoutHistory={payoutHistory}
      />

      <div className="pt-2 border-t border-neutral-200 space-y-6">
        <div>
          <h2 className="text-lg font-bold font-display text-neutral-900">
            Daftar Pesanan Masuk
          </h2>
          <p className="text-xs text-neutral-500">
            {orders.length} total pesanan dari pembeli dengan garansi pembayaran Midtrans.
          </p>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-lg border-neutral-300">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500 font-medium">Perlu Dikirim</p>
                <p className="text-2xl font-bold font-mono text-blue-700">{paidCount}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-neutral-300">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500 font-medium">Dalam Pengiriman</p>
                <p className="text-2xl font-bold font-mono text-purple-700">{shippedCount}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-neutral-300">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500 font-medium">Selesai</p>
                <p className="text-2xl font-bold font-mono text-emerald-700">{completedCount}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-neutral-300">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500 font-medium">Menunggu Bayar</p>
                <p className="text-2xl font-bold font-mono text-amber-600">{pendingCount}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        <SellerOrderList orders={orders} />
      </div>
    </div>
  );
}
