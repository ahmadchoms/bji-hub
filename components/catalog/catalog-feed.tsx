import Link from "next/link";
import { getCatalogFeed } from "@/lib/data";
import {
  parseCatalogParams,
  type CatalogParams,
} from "@/lib/validations/catalog-params.schema";
import { TokopediaSortBar } from "@/components/catalog/tokopedia-sort-bar";
import { ProductList } from "@/components/catalog/product-feed";
import { LoadMore } from "@/components/catalog/load-more";

export async function CatalogFeed({ params }: { params: CatalogParams }) {
  try {
    const feed = await getCatalogFeed(
      {
        categorySlug: params.category || params.kategori,
        originRegion: params.origin || params.asal,
        processMethod: params.process || params.proses,
        roastLevel: params.roast || params.sangrai,
        minPrice: params.min_price ?? params.harga_min,
        maxPrice: params.max_price ?? params.harga_max,
        isVerified: params.verified,
        readyStock: params.ready_stock,
        search: params.q,
        sort: params.sort,
        minCuppingScore: params.cupping_score ?? params.min_cupping,
      },
      params.page,
    );
    const currentPage = params.page;
    const cleanParams: Record<string, string | undefined> = {
      q: params.q || undefined,
      category: params.category || params.kategori || undefined,
      origin: params.origin || params.asal || undefined,
      process: params.process || params.proses || undefined,
      roast: params.roast || params.sangrai || undefined,
      min_price: params.min_price !== undefined ? String(params.min_price) : params.harga_min !== undefined ? String(params.harga_min) : undefined,
      max_price: params.max_price !== undefined ? String(params.max_price) : params.harga_max !== undefined ? String(params.harga_max) : undefined,
      cupping_score: params.cupping_score !== undefined ? String(params.cupping_score) : params.min_cupping !== undefined ? String(params.min_cupping) : undefined,
      verified: params.verified ? "true" : undefined,
      ready_stock: params.ready_stock ? "true" : undefined,
      sort: params.sort !== "newest" ? params.sort : undefined,
    };
    const serialized = new URLSearchParams(
      Object.entries(cleanParams)
        .filter(([, value]) => value !== undefined && value !== "")
        .map(([key, value]) => [key, String(value)]),
    ).toString();

    const nextParams = new URLSearchParams(serialized);
    nextParams.set("page", String(currentPage + 1));
    const nextUrl = feed.hasMore ? `/?${nextParams.toString()}` : null;

    return (
      <div className="space-y-3.5">
        <TokopediaSortBar total={feed.total} />
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
          <div className="py-12 px-6 rounded-2xl border border-neutral-200 bg-neutral-50/70 text-center max-w-lg mx-auto my-8 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mx-auto mb-3 text-2xl">
              ☕
            </div>
            <h3 className="font-display text-lg font-semibold text-neutral-900">
              Tidak Ada Biji Kopi yang Cocok
            </h3>
            <p className="mt-1.5 text-xs text-neutral-600 max-w-sm mx-auto leading-relaxed">
              Kriteria filter atau kata kunci saat ini belum memiliki hasil. Coba longgarkan rentang skor rasa atau reset filter untuk melihat katalog lengkap.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <Link
                href="/"
                className="px-4 py-2 text-xs font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-xs"
              >
                Reset Semua Filter
              </Link>
              <a
                href="https://wa.me/6281234567890?text=Halo%20Tim%20Sourcing%20Biji%20Corp%2C%20saya%20mencari%20lot%20kopi%20spesifik%20untuk%20roastery%20saya."
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-xs font-medium rounded-lg border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Hubungi Tim Sourcing (WA)
              </a>
            </div>
          </div>
        )}
      </div>
    );
  } catch {
    return (
      <div className="py-10">
        <p className="font-display text-xl text-neutral-900">
          Gagal memuat produk.
        </p>
        <Link
          href="/"
          className="mt-3 inline-block text-sm font-medium text-primary-600 hover:underline"
        >
          Coba lagi
        </Link>
      </div>
    );
  }
}

export function parseFeedParams(
  raw: Record<string, string | string[] | undefined>,
) {
  return parseCatalogParams(raw);
}
