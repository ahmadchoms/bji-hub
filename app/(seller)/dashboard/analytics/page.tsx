import Link from "next/link";
import {
  getSellerListingPerformance,
  getSellerPlanState,
  getSellerStats,
} from "@/lib/data";
import { SectionHeader } from "@/components/shared/section-header";
import { MetricsChart } from "@/components/dashboard/metrics-chart";
import { ListingPerformanceTable } from "@/components/dashboard/listing-performance-table";
import { getPlan } from "@/lib/plans";
import { requireSeller } from "@/lib/auth/session";
import { StatList } from "@/components/dashboard/stat-list";

export const dynamic = "force-dynamic";

const nf = new Intl.NumberFormat("id-ID");

export default async function DashboardAnalyticsPage() {
  const { sellerId } = await requireSeller();
  const [planState, stats, performance] = await Promise.all([
    getSellerPlanState(sellerId),
    getSellerStats(sellerId),
    getSellerListingPerformance(sellerId),
  ]);

  const plan = getPlan(planState.tier);
  const showPerListing = plan.analytics !== "summary";
  const showAds = plan.analytics === "full";

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Analitik"
        subtitle="Performa listing dan klik kontak toko Anda dalam 30 hari terakhir."
      />

      <StatList
        items={[
          { label: "Klik Kontak", value: nf.format(stats.totalClicks) },
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
