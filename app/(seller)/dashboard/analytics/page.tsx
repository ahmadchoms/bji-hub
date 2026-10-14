import Link from "next/link";
import {
  getSellerListingPerformance,
  getSellerPlanState,
  getSellerStats,
} from "@/lib/data";
import { getOrdersBySeller } from "@/lib/data/orders";
import { SectionHeader } from "@/components/shared/section-header";
import { MetricsChart } from "@/components/dashboard/metrics-chart";
import { RevenueChart, RevenueDataPoint } from "@/components/dashboard/revenue-chart";
import { ListingPerformanceTable } from "@/components/dashboard/listing-performance-table";
import { getPlan } from "@/lib/plans";
import { requireSeller } from "@/lib/auth/session";
import { StatList } from "@/components/dashboard/stat-list";
import { formatRupiah } from "@/components/shared/price-text";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export const dynamic = "force-dynamic";

const nf = new Intl.NumberFormat("id-ID");

export default async function DashboardAnalyticsPage() {
  const { sellerId } = await requireSeller();
  const [planState, stats, performance, orders] = await Promise.all([
    getSellerPlanState(sellerId),
    getSellerStats(sellerId),
    getSellerListingPerformance(sellerId),
    getOrdersBySeller(sellerId),
  ]);

  const plan = getPlan(planState.tier);
  const showPerListing = plan.analytics !== "summary";
  const showAds = plan.analytics === "full";

  const validOrders = orders.filter(
    (o) => o.status === "paid" || o.status === "shipped" || o.status === "completed",
  );
  const totalRevenue = validOrders.reduce((acc, o) => acc + o.subtotal, 0);
  const completedOrders = orders.filter((o) => o.status === "completed").length;

  // Aggregate daily revenue from recent valid orders
  const revenueMap = new Map<string, { revenue: number; orders: number }>();
  for (const o of validOrders) {
    const dayKey = format(new Date(o.createdAt), "d MMM", { locale: idLocale });
    const existing = revenueMap.get(dayKey) || { revenue: 0, orders: 0 };
    existing.revenue += o.subtotal;
    existing.orders += 1;
    revenueMap.set(dayKey, existing);
  }

  const revenueData: RevenueDataPoint[] = Array.from(revenueMap.entries()).map(
    ([date, val]) => ({
      date,
      revenue: val.revenue,
      orders: val.orders,
    }),
  );

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Analitik"
        subtitle="Performa penjualan, listing, dan klik kontak toko Anda."
      />

      <StatList
        items={[
          { label: "Omzet Bersih", value: formatRupiah(totalRevenue), hint: `${validOrders.length} pesanan online` },
          { label: "Pesanan Selesai", value: `${completedOrders}`, hint: "Transaksi sukses" },
          { label: "Klik Kontak", value: nf.format(stats.totalClicks), hint: "WhatsApp inquiry" },
          ...(showPerListing
            ? [
                { label: "Dilihat", value: nf.format(stats.totalViews) },
                { label: "Rasio Kontak", value: `${stats.conversionRate}%` },
              ]
            : []),
          ...(showAds
            ? [
                {
                  label: "Tayangan Iklan",
                  value: nf.format(stats.totalImpressions),
                },
              ]
            : []),
        ]}
      />

      {/* Revenue Trend Chart */}
      <RevenueChart data={revenueData} totalRevenue={totalRevenue} />

      {showPerListing ? (
        <>
          <MetricsChart data={stats.metrics} />
          <section className="space-y-3">
            <h2 className="border-b border-neutral-300 pb-3 font-display text-xl font-semibold text-neutral-900">
              Per listing
            </h2>
            <ListingPerformanceTable rows={performance} showAds={showAds} />
          </section>
        </>
      ) : (
        <p className="text-sm text-neutral-600">
          Statistik per listing tersedia mulai paket Growth.{" "}
          <Link
            href="/pricing"
            className="font-medium text-primary-600 hover:underline"
          >
            Lihat paket
          </Link>
        </p>
      )}
    </div>
  );
}
