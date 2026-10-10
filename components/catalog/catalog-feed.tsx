import Link from "next/link";
import { getCatalogFeed } from "@/lib/data";
import {
  parseCatalogParams,
  type CatalogParams,
} from "@/lib/validations/catalog-params.schema";
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
        sort:
          params.urut === "harga_terendah"
            ? "price_asc"
            : params.urut === "harga_tertinggi"
              ? "price_desc"
              : "newest",
      },
      params.halaman,
    );
    const serialized = new URLSearchParams(
      Object.entries(params)
        .filter(
          ([, value]) => value !== "" && value !== false && value !== undefined,
        )
        .map(([key, value]) => [key, String(value)]),
    ).toString();

    const nextParams = new URLSearchParams(serialized);
    nextParams.set("halaman", String(params.halaman + 1));
    const nextUrl = feed.hasMore ? `/?${nextParams.toString()}` : null;

    return (
      <>
        <ResultMeta
          total={feed.total}
          params={new URLSearchParams(serialized)}
        />
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
      </>
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
