import { getCategories } from "@/lib/data";
import { getApprovedProducersForSeller } from "@/lib/data/producers";
import { SectionHeader } from "@/components/shared/section-header";
import { ListingForm } from "@/components/dashboard/listing-form";
import { requireSeller } from "@/lib/auth/session";

export default async function CreateListingPage() {
  const { sellerId } = await requireSeller("/dashboard/listing/create");
  const [categories, producers] = await Promise.all([
    getCategories(),
    getApprovedProducersForSeller(sellerId).catch(() => []),
  ]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Tambah Produk Baru"
        subtitle="Isi informasi produk kopi Anda untuk ditampilkan di katalog."
      />
      <ListingForm categories={categories} producers={producers} />
    </div>
  );
}
