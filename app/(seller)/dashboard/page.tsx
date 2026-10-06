import {
  getSellerById,
  getSellerStats,
  getInquiries,
  getSellerPlanState,
} from "@/lib/data";
import { SectionHeader } from "@/components/shared/section-header";
import { MetricsChart } from "@/components/dashboard/metrics-chart";
import { SubscriptionStatus } from "@/components/dashboard/subscription-status";
import { InquiryList } from "@/components/dashboard/inquiry-list";
import { requireSeller } from "@/lib/auth/session";
import { StatList } from "@/components/dashboard/stat-list";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const { sellerId } = await requireSeller();
  const [seller, planState, stats, inquiries] = await Promise.all([
    getSellerById(sellerId),
    getSellerPlanState(sellerId),
    getSellerStats(sellerId),
    getInquiries(sellerId),
  ]);

  if (!seller) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-neutral-500">Data seller tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title={`Halo, ${seller.businessName}`}
        subtitle={`30 hari terakhir: listing dilihat ${stats.totalViews.toLocaleString("id-ID")}x, ${stats.totalClicks.toLocaleString("id-ID")} klik kontak`}
      />

      <StatList
        items={[
          { label: "Dilihat", value: stats.totalViews.toLocaleString("id-ID") },
          {
            label: "Klik Kontak",
            value: stats.totalClicks.toLocaleString("id-ID"),
          },
          { label: "Rasio Kontak", value: `${stats.conversionRate}%` },
          {
            label: "Produk Aktif",
            value: `${stats.activeListings} / ${stats.totalListings}`,
          },
          { label: "Pesan Masuk", value: String(inquiries.length) },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MetricsChart data={stats.metrics} />
        </div>
        <SubscriptionStatus state={planState} />
      </div>

      {inquiries.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-baseline justify-between pb-3 border-b border-neutral-300">
            <h2 className="font-display text-xl text-neutral-900 font-semibold">
              Inquiry Terbaru
            </h2>
            <a
              href="/dashboard/inquiry"
              className="text-xs font-medium text-primary-600 hover:underline"
            >
              Lihat semua →
            </a>
          </div>
          <InquiryList inquiries={inquiries.slice(0, 3)} />
        </div>
      )}
    </div>
  );
}
