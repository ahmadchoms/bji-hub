import { getSellerById } from "@/lib/data";
import { SectionHeader } from "@/components/shared/section-header";
import { ListingTable } from "@/components/dashboard/listing-table";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { requireSeller } from "@/lib/auth/session";

export default async function DashboardListingPage() {
  const { sellerId } = await requireSeller();
  const seller = await getSellerById(sellerId);

  if (!seller) {
    return <p className="text-neutral-500">Data seller tidak ditemukan.</p>;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Produk Saya"
        subtitle={`${seller.listings.length} listing terdaftar di toko Anda.`}
        action={
          <Link
            href="/dashboard/listing/create"
            className={buttonVariants({ variant: "primary", size: "sm" })}
          >
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
