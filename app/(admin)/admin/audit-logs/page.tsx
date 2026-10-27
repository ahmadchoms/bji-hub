import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getAuditLogs } from "@/lib/data/audit-logs";
import { SectionHeader } from "@/components/shared/section-header";
import { AdminAuditLogs } from "@/components/admin/admin-audit-logs";

export const metadata: Metadata = {
  title: "Audit Log Admin - Biji Hub",
  description: "Catatan riwayat tindakan administratif marketplace Biji Hub.",
};

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage() {
  await requireRole(["admin"], "/admin/audit-logs");
  const logs = await getAuditLogs({ limit: 100 });

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Audit Log Aktivitas Admin"
        subtitle="Riwayat tindakan kritis administrator: persetujuan payout, putusan sengketa transaksi, pengembalian dana manual, verifikasi seller, dan moderasi listing."
      />

      <AdminAuditLogs logs={logs} />
    </div>
  );
}
