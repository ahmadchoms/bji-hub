import Link from "next/link";
import { getCatalogFeed } from "@/lib/mock/repository";
import { parseCatalogParams, type CatalogParams } from "@/lib/validations/catalog-params.schema";
import { ProductList, ResultMeta } from "@/components/catalog/product-feed";
import { LoadMore } from "@/components/catalog/load-more";

export async function CatalogFeed({ params }: { params: CatalogParams }) {
  try {
    const feed = await getCatalogFeed(
      {
        categorySlug: params.kategori,
        originRegion: params.asal,
        processMethod: params.proses,
        roastLevel: params.sangrai,
        minPrice: params.harga_min,
        maxPrice: params.harga_max,
        isVerified: params.verified,
        search: params.q,
        sort: params.urut === "harga_terendah" ? "price_asc" : params.urut === "harga_tertinggi" ? "price_desc" : "newest",
      },
      params.halaman
    );
    const serialized = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== "" && value !== false && value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString();
    
    const nextParams = new URLSearchParams(serialized);
    nextParams.set("halaman", String(params.halaman + 1));
    const nextUrl = feed.hasMore ? `/?${nextParams.toString()}` : null;

    return (
      <>
        <ResultMeta total={feed.total} params={new URLSearchParams(serialized)} />
        {feed.items.length ? (
          <>
            <ProductList items={feed.items} />
            {nextUrl && (
              <div className="flex justify-center py-8">
                <LoadMore href={nextUrl} />
              </div>
            )}
          </>
        ) : (
          <div className="py-10">
            <p className="font-display text-xl text-neutral-900">Tidak ada produk yang cocok.</p>
            <Link href="/" className="mt-3 inline-block text-sm font-medium text-primary-600 hover:underline">Hapus filter</Link>
          </div>
        )}
      </>
    );
  } catch {
    return (
      <div className="py-10">
        <p className="font-display text-xl text-neutral-900">Gagal memuat produk.</p>
        <Link href="/" className="mt-3 inline-block text-sm font-medium text-primary-600 hover:underline">Coba lagi</Link>
      </div>
    );
  }
}

export function parseFeedParams(raw: Record<string, string | string[] | undefined>) {
  return parseCatalogParams(raw);
}
