import { getCategories } from "@/lib/data";
import { SectionHeader } from "@/components/shared/section-header";
import { ListingForm } from "@/components/dashboard/listing-form";

export default async function CreateListingPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Tambah Produk Baru"
        subtitle="Isi informasi produk kopi Anda untuk ditampilkan di katalog."
      />
      <ListingForm categories={categories} />
    </div>
  );
}
