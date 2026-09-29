import Link from "next/link";
import { ListingCard } from "@/components/catalog/listing-card";
import { ListingWithRelations } from "@/types";

interface CategoryTabsProps {
  categories: { slug: string; name: string }[];
  active: string;
}

export function CategoryTabs({ categories, active }: CategoryTabsProps) {
  const items = [{ slug: "", name: "Semua" }, ...categories];
  return (
    <nav aria-label="Kategori" className="overflow-x-auto border-b border-neutral-300 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="mx-auto flex min-w-max max-w-7xl px-4 sm:px-6 lg:px-8">
        {items.map((item) => {
          const selected = active === item.slug;
          return (
            <Link
              key={item.slug || "all"}
              href={item.slug ? `/?kategori=${encodeURIComponent(item.slug)}` : "/"}
              aria-current={selected ? "page" : undefined}
              className={`min-h-11 border-b-2 px-4 py-3 text-xs font-medium ${selected ? "border-primary-600 text-primary-900" : "border-transparent text-neutral-600 hover:text-neutral-900"}`}
            >
              {item.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function ResultMeta({ total, params }: { total: number; params: URLSearchParams }) {
  const active = [
    params.get("q"), params.get("kategori"), params.get("asal"), params.get("proses"), params.get("sangrai"), params.get("harga_min") || params.get("harga_max") ? "Harga" : "", params.get("verified") === "true" ? "Terverifikasi" : "",
  ].filter(Boolean);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4" aria-live="polite">
      <p className="font-mono text-sm tabular-nums text-neutral-900">{total} produk</p>
      {active.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600">
          <span>{active.join(" · ")}</span>
          <Link href="/" className="font-medium text-primary-600 hover:underline">Hapus filter</Link>
        </div>
      )}
    </div>
  );
}

export function ProductList({ items }: { items: ListingWithRelations[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4" aria-label="Daftar produk kopi">
      {items.map((listing, index) => <ListingCard key={listing.id} listing={listing} priority={index < 4} />)}
    </ul>
  );
}
