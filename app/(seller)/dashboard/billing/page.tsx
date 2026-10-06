import { requireSeller } from "@/lib/auth/session";
import { getSellerById, getSellerPlanState } from "@/lib/data";
import { SectionHeader } from "@/components/shared/section-header";
import { PlanSection } from "@/components/dashboard/plan-section";
import { BillingSection } from "@/components/dashboard/billing-section";
import { getBoostCredits } from "@/lib/boost-credits";
import { getPlan } from "@/lib/plans";

export default async function DashboardBillingPage() {
  const { sellerId } = await requireSeller();
  const [seller, planState] = await Promise.all([
    getSellerById(sellerId),
    getSellerPlanState(sellerId),
  ]);

  if (!seller) {
    return <p className="text-neutral-500">Data seller tidak ditemukan.</p>;
  }

  return (
    <div className="space-y-10">
      <SectionHeader
        title="Langganan & Pembayaran"
        subtitle="Kelola paket langganan, boost listing, dan riwayat pembayaran."
      />
      <PlanSection state={planState} listingCount={seller.listings.length} />
      <BillingSection
        payments={seller.payments ?? []}
        listings={seller.listings}
        credits={getBoostCredits(
          getPlan(planState.tier),
          seller.payments ?? [],
        )}
      />
    </div>
  );
}
