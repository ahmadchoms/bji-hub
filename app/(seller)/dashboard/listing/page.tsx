import { getSellerById } from "@/lib/mock/repository";
import { SectionHeader } from "@/components/shared/section-header";
import { ListingTable } from "@/components/dashboard/listing-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const MOCK_SELLER_ID = "seller-1";

export default async function DashboardListingPage() {
  const seller = await getSellerById(MOCK_SELLER_ID);

  if (!seller) {
    return <p className="text-neutral-500">Data seller tidak ditemukan.</p>;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Produk Saya"
        subtitle={`${seller.listings.length} listing terdaftar di toko Anda.`}
        action={
          <Link href="/dashboard/listing/create">
            <Button variant="primary" size="sm">
              Tambah Produk
            </Button>
          </Link>
        }
      />
      <ListingTable listings={seller.listings} />
    </div>
  );
}
