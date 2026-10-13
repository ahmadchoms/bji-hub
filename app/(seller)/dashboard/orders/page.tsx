import { requireSeller } from "@/lib/auth/session";
import { getOrdersBySeller } from "@/lib/data/orders";
import { SectionHeader } from "@/components/shared/section-header";
import { SellerOrderList } from "@/components/dashboard/seller-order-list";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Truck, CheckCircle2, Clock } from "lucide-react";

export const metadata = {
  title: "Pesanan Masuk - Biji Hub Seller",
  description: "Kelola pesanan pembeli dan input resi pengiriman.",
};

export default async function DashboardOrdersPage() {
  const { sellerId } = await requireSeller();
  const orders = await getOrdersBySeller(sellerId);

  const pendingCount = orders.filter((o) => o.status === "pending_payment").length;
  const paidCount = orders.filter((o) => o.status === "paid").length;
  const shippedCount = orders.filter((o) => o.status === "shipped").length;
  const completedCount = orders.filter((o) => o.status === "completed").length;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Pesanan Masuk"
        subtitle={`${orders.length} total transaksi langsung dengan garansi pembayaran.`}
      />

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
  );
}
