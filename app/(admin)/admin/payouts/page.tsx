import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getAllPayoutRequests } from "@/lib/data/payouts";
import { SectionHeader } from "@/components/shared/section-header";
import { AdminPayoutList } from "@/components/admin/admin-payout-list";
import { Card, CardContent } from "@/components/ui/card";
import { formatRupiah } from "@/components/shared/price-text";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Pencairan Dana Penjual - Admin Biji Hub",
  description: "Kelola dan verifikasi transfer penarikan dana escrow mitra roastery.",
};

export default async function AdminPayoutsPage() {
  await requireRole(["admin"], "/admin/payouts");
  const payouts = await getAllPayoutRequests();

  const pendingPayouts = payouts.filter((p) => p.status === "pending");
  const processedPayouts = payouts.filter((p) => p.status === "processed");
  const rejectedPayouts = payouts.filter((p) => p.status === "rejected");

  const totalPendingAmount = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);
  const totalProcessedAmount = processedPayouts.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Pencairan Dana Penjual (Escrow Payout)"
        subtitle="Verifikasi rekening tujuan dan konfirmasi transfer hasil penjualan mitra kopi."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-lg border-amber-300 bg-amber-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-800">Perlu Ditransfer</p>
              <p className="text-xl font-bold font-mono text-amber-950 mt-0.5">
                {formatRupiah(totalPendingAmount)}
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                {pendingPayouts.length} pengajuan menunggu
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-emerald-300 bg-emerald-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-800">Total Berhasil Ditransfer</p>
              <p className="text-xl font-bold font-mono text-emerald-950 mt-0.5">
                {formatRupiah(totalProcessedAmount)}
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                {processedPayouts.length} pengajuan selesai
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-neutral-300 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-neutral-600">Total Pengajuan Ditolak</p>
              <p className="text-xl font-bold font-mono text-neutral-900 mt-0.5">
                {rejectedPayouts.length}
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Rekening tidak valid / tidak sesuai
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <AdminPayoutList payouts={payouts} />
    </div>
  );
}
