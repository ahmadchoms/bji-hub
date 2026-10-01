import { getSellerById } from "@/lib/mock/repository";
import { SectionHeader } from "@/components/shared/section-header";
import { BillingSection } from "@/components/dashboard/billing-section";
import { requireSeller } from "@/lib/auth/session";

export default async function DashboardBillingPage() {
  const { sellerId } = await requireSeller();
  const seller = await getSellerById(sellerId);

  if (!seller) {
    return <p className="text-neutral-500">Data seller tidak ditemukan.</p>;
  }

  const activeSubscription = seller.subscriptions?.find(
    (s) => s.status === "active",
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Langganan & Pembayaran"
        subtitle="Kelola paket langganan, boost listing, dan riwayat pembayaran."
      />
      <BillingSection
        subscription={activeSubscription}
        payments={seller.payments ?? []}
        listings={seller.listings}
      />
    </div>
  );
}
