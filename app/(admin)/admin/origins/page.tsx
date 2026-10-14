import { SectionHeader } from "@/components/shared/section-header";
import { getCoffeeOrigins } from "@/lib/data/origins";
import { AdminOriginsTable } from "@/components/admin/admin-origins-table";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Master Asal Kopi (Origins) | Admin Biji Hub",
};

export default async function AdminOriginsPage() {
  const origins = await getCoffeeOrigins();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SectionHeader
          title="Master Asal Kopi (Terroir & Region)"
          subtitle="Kelola database daerah asal kopi domestik (Gayo, Toraja, Bajawa) dan internasional (Ethiopia, Colombia) untuk ekspansi perdagangan global."
        />
        <Badge variant="secondary" className="w-fit font-mono text-xs px-2.5 py-1">
          {origins.length} Terdaftar
        </Badge>
      </div>

      <AdminOriginsTable origins={origins} />
    </div>
  );
}
