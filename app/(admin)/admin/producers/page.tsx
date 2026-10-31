import { SectionHeader } from "@/components/shared/section-header";
import { getProducers, getProducerAttributions } from "@/lib/data/producers";
import { AdminProducersTable } from "@/components/admin/admin-producers-table";
import { AdminProducerAttributions } from "@/components/admin/admin-producer-attributions";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Master Produser & Verifikasi Klaim | Admin Biji Hub",
};

export default async function AdminProducersPage() {
  const [producers, attributions] = await Promise.all([
    getProducers(),
    getProducerAttributions().catch(() => []),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SectionHeader
          title="Master Produser & Verifikasi Klaim"
          subtitle="Kelola profil petani, koperasi, dan pengolah kopi serta verifikasi bukti klaim sertifikasi dan Indikasi Geografis (GI) untuk transparansi rantai pasok."
        />
        <Badge variant="secondary" className="w-fit font-mono text-xs px-2.5 py-1">
          {producers.length} Terdaftar
        </Badge>
      </div>

      <AdminProducerAttributions attributions={attributions} />

      <AdminProducersTable producers={producers} />
    </div>
  );
}
