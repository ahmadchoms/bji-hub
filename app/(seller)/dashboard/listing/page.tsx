import { getSellerById } from "@/lib/data";
import { SectionHeader } from "@/components/shared/section-header";
import { ListingTable } from "@/components/dashboard/listing-table";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { requireSeller } from "@/lib/auth/session";

import { ExportCsvButton } from "@/components/shared/export-csv-button";

export default async function DashboardListingPage() {
  const { sellerId } = await requireSeller();
  const seller = await getSellerById(sellerId);

  if (!seller) {
    return <p className="text-neutral-600">Data seller tidak ditemukan.</p>;
  }

  const formattedListingCsvData = seller.listings.map((l) => ({
    title: l.title,
    category: l.category.name,
    price: Number(l.price),
    unit: l.unit,
    stock: l.stock ?? 50,
    status: l.status,
    origin: l.tasteProfile?.originRegion || "-",
    process: l.tasteProfile?.processMethod || "-",
    roast: l.tasteProfile?.roastLevel || "-",
    cupping: l.tasteProfile?.cuppingScore || "-",
  }));

  const listingCsvColumns = [
    { key: "title" as const, label: "Judul Produk" },
    { key: "category" as const, label: "Kategori" },
    { key: "price" as const, label: "Harga" },
    { key: "unit" as const, label: "Satuan" },
    { key: "stock" as const, label: "Sisa Stok" },
    { key: "status" as const, label: "Status" },
    { key: "origin" as const, label: "Origin" },
    { key: "process" as const, label: "Proses" },
    { key: "roast" as const, label: "Roast" },
    { key: "cupping" as const, label: "Skor SCA" },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Produk Saya"
        subtitle={`${seller.listings.length} listing terdaftar di toko Anda.`}
        action={
          <div className="flex items-center gap-2">
            <ExportCsvButton
              data={formattedListingCsvData}
              columns={listingCsvColumns}
              filename={`inventaris-kopi-${seller.slug}.csv`}
            />
            <Link
              href="/dashboard/listing/create"
              className={buttonVariants({ variant: "primary", size: "sm" })}
            >
              <Button variant="primary" size="sm">
                Tambah Produk
              </Button>
            </Link>
          </div>
        }
      />
      <ListingTable listings={seller.listings} />
    </div>
  );
}
