import { getSellerById, getSellerStats, getInquiries } from "@/lib/mock/repository";
import { SectionHeader } from "@/components/shared/section-header";
import { MetricsChart } from "@/components/dashboard/metrics-chart";
import { SubscriptionStatus } from "@/components/dashboard/subscription-status";
import { InquiryList } from "@/components/dashboard/inquiry-list";

const MOCK_SELLER_ID = "seller-1";

export default async function DashboardOverviewPage() {
  const [seller, stats, inquiries] = await Promise.all([
    getSellerById(MOCK_SELLER_ID),
    getSellerStats(MOCK_SELLER_ID),
    getInquiries(MOCK_SELLER_ID),
  ]);

  if (!seller) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-neutral-500">Data seller tidak ditemukan.</p>
      </div>
    );
  }

  const activeSubscription = seller.subscriptions?.find((s) => s.status === "active");

  return (
    <div className="space-y-8">
      <SectionHeader
        title={`Halo, ${seller.businessName}`}
        subtitle={`Listing dilihat ${stats.totalViews.toLocaleString("id-ID")}x, ${stats.totalClicks} klik kontak bulan ini`}
      />

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-neutral-300 rounded-sm p-4">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Total Tayangan</p>
          <p className="font-mono tabular-nums text-2xl text-primary-900 font-bold mt-1">
            {stats.totalViews.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="border border-neutral-300 rounded-sm p-4">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Klik Kontak</p>
          <p className="font-mono tabular-nums text-2xl text-primary-900 font-bold mt-1">
            {stats.totalClicks.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="border border-neutral-300 rounded-sm p-4">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Konversi</p>
          <p className="font-mono tabular-nums text-2xl text-primary-900 font-bold mt-1">
            {stats.conversionRate}%
          </p>
        </div>
        <div className="border border-neutral-300 rounded-sm p-4">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Produk Aktif</p>
          <p className="font-mono tabular-nums text-2xl text-primary-900 font-bold mt-1">
            {stats.activeListings} / {stats.totalListings}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MetricsChart data={stats.metrics} />
        </div>
        <div className="space-y-6">
          <SubscriptionStatus subscription={activeSubscription} />
          <div className="border border-neutral-300 rounded-sm p-4">
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Pesan Masuk</p>
            <p className="font-mono tabular-nums text-2xl text-primary-900 font-bold mt-1">
              {inquiries.length}
            </p>
            <p className="text-xs text-neutral-500 mt-1">Inquiry dari calon pembeli</p>
          </div>
        </div>
      </div>

      {inquiries.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-baseline justify-between pb-3 border-b border-neutral-300">
            <h2 className="font-display text-xl text-neutral-900 font-semibold">Inquiry Terbaru</h2>
            <a href="/dashboard/inquiry" className="text-xs font-medium text-primary-600 hover:underline">
              Lihat semua →
            </a>
          </div>
          <InquiryList inquiries={inquiries.slice(0, 3)} />
        </div>
      )}
    </div>
  );
}