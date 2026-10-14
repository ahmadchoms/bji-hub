import { Suspense } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { CategoryQuickGrid } from "@/components/catalog/category-quick-grid";
import { CatalogSidebarFilter } from "@/components/catalog/catalog-sidebar-filter";
import {
  CatalogFeed,
  parseFeedParams,
} from "@/components/catalog/catalog-feed";
import { ProductGridSkeleton } from "@/components/catalog/product-grid-skeleton";
import { TasteQuizModal } from "@/components/catalog/taste-quiz-modal";
import { getCategories, getFilterOptions } from "@/lib/data";
import { ShieldCheck } from "lucide-react";

interface HomePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const rawParams = await searchParams;
  const params = parseFeedParams(rawParams);
  const [categories, options] = await Promise.all([
    getCategories(),
    getFilterOptions(),
  ]);

  const activeCategory = params.category || params.kategori || "";

  // Serialise raw params for the Suspense key
  const serialized = new URLSearchParams(
    Object.entries(rawParams).flatMap(([key, value]) =>
      value === undefined
        ? []
        : [[key, Array.isArray(value) ? value[0] : value]],
    ),
  );

  return (
    <div className="bg-neutral-50/40 min-h-screen">
      {/* Tokopedia-Style Promo Hero Section */}
      <section className="bg-neutral-900 text-white py-7 border-b border-neutral-800">
        <PageContainer className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Rekening Bersama Escrow Resmi Biji Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
              Bursa Biji Kopi Specialty Terpercaya Nusantara
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              Hubungkan roastery, kedai kopi, dan penikmat seduh langsung ke petani & prosesor lokal terbaik. Transaksi aman, data cupping transparan.
            </p>
          </div>

          <div className="bg-neutral-800/80 border border-neutral-700/80 p-4 rounded-xl text-xs space-y-2.5 shrink-0 max-w-xs w-full text-center shadow-lg">
            <p className="font-semibold text-neutral-100 flex items-center justify-center gap-1.5">
              <span>☕</span> Bingung Menentukan Pilihan?
            </p>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Ikuti kuis selera 30 detik untuk dapat rekomendasi beans yang sesuai dengan alat seduhmu.
            </p>
            <TasteQuizModal triggerVariant="banner" />
          </div>
        </PageContainer>
      </section>

      {/* Category Quick Grid (Tokopedia Style) */}
      <CategoryQuickGrid activeCategory={activeCategory} />

      {/* Tokopedia-Style 2-Column Marketplace Feed */}
      <div className="py-6">
        <PageContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
            {/* Kolom Kiri: Sidebar Filter Sticky */}
            <div className="lg:col-span-3">
              <CatalogSidebarFilter
                origins={options.origins}
                processes={options.processes}
                roastLevels={options.roastLevels}
                categories={categories}
              />
            </div>

            {/* Kolom Kanan: Feed Produk & Sort Bar */}
            <div className="lg:col-span-9 space-y-4">
              <Suspense
                key={serialized.toString()}
                fallback={
                  <div className="py-4">
                    <ProductGridSkeleton />
                  </div>
                }
              >
                <CatalogFeed params={params} />
              </Suspense>
            </div>
          </div>
        </PageContainer>
      </div>
    </div>
  );
}
