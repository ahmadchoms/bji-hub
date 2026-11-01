import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getAdminRefundsAction } from "@/actions/refund.actions";
import { SectionHeader } from "@/components/shared/section-header";
import { AdminRefundQueue } from "@/components/admin/admin-refund-queue";

export const metadata: Metadata = {
  title: "Antrean Pengembalian Dana - Admin Biji Hub",
  description: "Kelola pengembalian dana, percobaan ulang gateway, dan transfer manual.",
};

export const dynamic = "force-dynamic";

export default async function AdminRefundsPage() {
  await requireRole(["admin"], "/admin/refunds");
  const res = await getAdminRefundsAction();
  const refunds = res.success ? res.data : [];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Antrean Pengembalian Dana (Refund)"
        subtitle="Kelola pengembalian dana pembeli untuk pesanan dibatalkan atau sengketa yang disetujui. Mendukung retry gateway Midtrans otomatis dan penyelesaian transfer manual."
      />

      <AdminRefundQueue refunds={refunds} />
    </div>
  );
}
