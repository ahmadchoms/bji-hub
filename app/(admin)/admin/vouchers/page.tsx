import { requireRole } from "@/lib/auth/session";
import { getAllVouchers } from "@/lib/data/vouchers";
import { VoucherManager } from "@/components/dashboard/voucher-manager";

export const metadata = {
  title: "Kelola Voucher Platform & Toko | Admin Biji Hub",
};

export default async function AdminVouchersPage() {
  await requireRole(["admin"], "/admin/vouchers");
  const vouchers = await getAllVouchers();

  return <VoucherManager initialVouchers={vouchers} isAdmin={true} />;
}
