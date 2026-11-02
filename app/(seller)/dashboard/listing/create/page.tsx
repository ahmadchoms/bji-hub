import { getCategories, getSellerById } from "@/lib/data";
import { getApprovedProducersForSeller } from "@/lib/data/producers";
import { SectionHeader } from "@/components/shared/section-header";
import { ListingForm } from "@/components/dashboard/listing-form";
import { requireSeller } from "@/lib/auth/session";

export default async function CreateListingPage() {
  const { sellerId } = await requireSeller("/dashboard/listing/create");
  const [categories, producers, seller] = await Promise.all([
    getCategories(),
    getApprovedProducersForSeller(sellerId).catch(() => []),
    getSellerById(sellerId).catch(() => null),
  ]);

  const availableChildren = (seller?.listings || [])
    .filter((l) => l.status === "active" && l.kind !== "bundle")
    .map((l) => ({ id: l.id, title: l.title, stock: l.stock, price: Number(l.price) }));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Tambah Produk Baru"
        subtitle="Isi informasi produk kopi Anda untuk ditampilkan di katalog."
      />
      <ListingForm
        categories={categories}
        producers={producers}
        availableChildren={availableChildren}
      />
    </div>
  );
}
