import { requireSeller } from "@/lib/auth/session";
import { getVouchersBySeller } from "@/lib/data/vouchers";
import { VoucherManager } from "@/components/dashboard/voucher-manager";

export const metadata = {
  title: "Kelola Voucher Promo Toko | Biji Hub",
};

export default async function SellerVouchersPage() {
  const { sellerId } = await requireSeller("/dashboard/vouchers");
  const vouchers = await getVouchersBySeller(sellerId);

  return <VoucherManager initialVouchers={vouchers} sellerId={sellerId} />;
}
