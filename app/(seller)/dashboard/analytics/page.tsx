import { getSellerStats } from "@/lib/mock/repository";
import { SectionHeader } from "@/components/shared/section-header";
import { MetricsChart } from "@/components/dashboard/metrics-chart";

const MOCK_SELLER_ID = "seller-1";

export default async function DashboardAnalyticsPage() {
  const stats = await getSellerStats(MOCK_SELLER_ID);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Analitik"
        subtitle="Statistik performa listing dan konversi toko Anda."
      />

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border-b border-neutral-300 pb-2">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Total Tayangan</p>
          <p className="font-mono tabular-nums text-2xl text-primary-900 font-bold mt-1">
            {stats.totalViews.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="border-b border-neutral-300 pb-2">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Total Klik Kontak</p>
          <p className="font-mono tabular-nums text-2xl text-primary-900 font-bold mt-1">
            {stats.totalClicks.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="border-b border-neutral-300 pb-2">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Rasio Konversi</p>
          <p className="font-mono tabular-nums text-2xl text-primary-900 font-bold mt-1">
            {stats.conversionRate}%
          </p>
        </div>
        <div className="border-b border-neutral-300 pb-2">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Listing Aktif</p>
          <p className="font-mono tabular-nums text-2xl text-primary-900 font-bold mt-1">
            {stats.activeListings}
          </p>
        </div>
      </div>

      <MetricsChart data={stats.metrics} />
    </div>
  );
}