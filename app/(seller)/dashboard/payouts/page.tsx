import type { Metadata } from "next";
import { requireSeller } from "@/lib/auth/session";
import {
  getSellerBalanceSummary,
  getSellerBankDetails,
  getPayoutRequestsBySeller,
} from "@/lib/data/payouts";
import { SectionHeader } from "@/components/shared/section-header";
import { SellerPayoutManager } from "@/components/dashboard/seller-payout-manager";

export const metadata: Metadata = {
  title: "Pencairan Dana Penjualan | Dashboard Biji Hub",
  description: "Kelola saldo toko, pengajuan penarikan dana, dan rekening bank mitra roastery.",
};

export const dynamic = "force-dynamic";

export default async function SellerPayoutsPage() {
  const { sellerId } = await requireSeller("/dashboard/payouts");

  const [balanceSummary, bankDetails, payouts] = await Promise.all([
    getSellerBalanceSummary(sellerId),
    getSellerBankDetails(sellerId),
    getPayoutRequestsBySeller(sellerId),
  ]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Pencairan Dana Penjualan (Payout)"
        subtitle="Pantau saldo hasil penjualan kopi yang siap ditarik ke rekening bank Anda tanpa komisi transaksi."
      />

      <SellerPayoutManager
        balanceSummary={balanceSummary}
        bankDetails={bankDetails}
        payouts={payouts}
      />
    </div>
  );
}
