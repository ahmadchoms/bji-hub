import { getCategories } from "@/lib/data";
import { getProducers } from "@/lib/data/producers";
import { SectionHeader } from "@/components/shared/section-header";
import { ListingForm } from "@/components/dashboard/listing-form";

export default async function CreateListingPage() {
  const [categories, producers] = await Promise.all([
    getCategories(),
    getProducers().catch(() => []),
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
