import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { SectionHeader } from "@/components/shared/section-header";
import { AdminMaintenanceControl } from "@/components/admin/admin-maintenance-control";

export const metadata: Metadata = {
  title: "Pemeliharaan Sistem - Admin Biji Hub",
  description: "Jalankan pembersihan pesanan kedaluwarsa dan penyelesaian otomatis tanpa cron.",
};

export const dynamic = "force-dynamic";

export default async function AdminMaintenancePage() {
  await requireRole(["admin"], "/admin/maintenance");

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Pemeliharaan Tanpa Cron (Opportunistic Maintenance)"
        subtitle="Kelola dan picu sinkronisasi status pesanan dan pelepasan stok secara manual. Sistem juga otomatis menjalankan lazy sweep saat pembeli checkout dan penjual membuka saldo."
      />

      <AdminMaintenanceControl />
    </div>
  );
}
