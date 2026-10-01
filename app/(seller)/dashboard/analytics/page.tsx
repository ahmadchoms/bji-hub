import Link from "next/link";
import {
  getSellerById,
  getSellerListingPerformance,
  getSellerStats,
} from "@/lib/mock/repository";
import { SectionHeader } from "@/components/shared/section-header";
import { MetricsChart } from "@/components/dashboard/metrics-chart";
import { ListingPerformanceTable } from "@/components/dashboard/listing-performance-table";
import { PLANS } from "@/lib/plans";
import { requireSeller } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const nf = new Intl.NumberFormat("id-ID");

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-neutral-300 pb-2">
      <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-primary-900">
        {value}
      </p>
    </div>
  );
}

export default async function DashboardAnalyticsPage() {
  const { sellerId } = await requireSeller();
  const [seller, stats, performance] = await Promise.all([
    getSellerById(sellerId),
    getSellerStats(sellerId),
    getSellerListingPerformance(sellerId),
  ]);

  const plan = PLANS.find((p) => p.tier === seller?.tier) ?? PLANS[0];
  const showPerListing = plan.analytics !== "summary";
  const showAds = plan.analytics === "full";

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Analitik"
        subtitle="Performa listing dan klik kontak toko Anda dalam 30 hari terakhir."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Klik Kontak" value={nf.format(stats.totalClicks)} />
        {showPerListing && (
          <Stat label="Dilihat" value={nf.format(stats.totalViews)} />
        )}
        {showPerListing && (
          <Stat label="Rasio Kontak" value={`${stats.conversionRate}%`} />
        )}
        {showAds && (
          <Stat
            label="Tayangan Iklan"
            value={nf.format(stats.totalImpressions)}
          />
        )}
      </div>

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
