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
import { OnboardingCard } from "@/components/dashboard/onboarding-card";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

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

  const lowStockListings = seller.listings.filter(
    (l) => l.status === "active" && typeof l.stock === "number" && l.stock <= 5,
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title={`Halo, ${seller.businessName}`}
        subtitle={`30 hari terakhir: listing dilihat ${stats.totalViews.toLocaleString("id-ID")}x, ${stats.totalClicks.toLocaleString("id-ID")} klik kontak`}
      />

      <OnboardingCard seller={seller} totalListings={stats.totalListings} />

      {lowStockListings.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-lg p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-xs text-amber-950">
                Peringatan Stok Menipis / Habis ({lowStockListings.length} Produk)
              </h3>
            </div>
            <Link
              href="/dashboard/listing"
              className="text-[11px] font-semibold text-amber-900 hover:underline"
            >
              Kelola Inventaris &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
            {lowStockListings.slice(0, 3).map((l) => (
              <div
                key={l.id}
                className="bg-white border border-amber-200 rounded p-2.5 flex items-center justify-between text-xs shadow-2xs"
              >
                <div className="truncate mr-2">
                  <p className="font-semibold text-neutral-900 truncate">{l.title}</p>
                  <p className="text-[10px] text-neutral-500 font-mono">
                    {l.tasteProfile?.originRegion || l.category.name}
                  </p>
                </div>
                <span
                  className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded shrink-0 ${
                    l.stock === 0
                      ? "bg-rose-100 text-rose-800 border border-rose-200"
                      : "bg-amber-100 text-amber-900 border border-amber-300"
                  }`}
                >
                  {l.stock === 0 ? "Habis" : `Sisa ${l.stock} ${l.unit}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
              Pesan Penawaran Terbaru
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
