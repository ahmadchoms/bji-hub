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
    return <p className="text-neutral-500">Data seller tidak ditemukan.</p>;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Produk Saya"
        subtitle={`${seller.listings.length} listing terdaftar di toko Anda.`}
        action={
          <div className="flex items-center gap-2">
            <ExportCsvButton
              data={seller.listings}
              columns={[
                { key: "title", label: "Judul Produk" },
                { key: "category", label: "Kategori", format: (_, l) => l.category.name },
                { key: "price", label: "Harga", format: (v) => Number(v) },
                { key: "unit", label: "Satuan" },
                { key: "stock", label: "Sisa Stok", format: (_, l) => l.stock ?? 50 },
                { key: "status", label: "Status" },
                { key: "origin", label: "Origin", format: (_, l) => l.tasteProfile?.originRegion || "-" },
                { key: "process", label: "Proses", format: (_, l) => l.tasteProfile?.processMethod || "-" },
                { key: "roast", label: "Roast", format: (_, l) => l.tasteProfile?.roastLevel || "-" },
                { key: "cupping", label: "Skor SCA", format: (_, l) => l.tasteProfile?.cuppingScore || "-" },
              ]}
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
