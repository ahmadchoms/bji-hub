import { Suspense } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { CategoryQuickGrid } from "@/components/catalog/category-quick-grid";
import { CatalogSidebarFilter } from "@/components/catalog/catalog-sidebar-filter";
import {
  CatalogFeed,
  parseFeedParams,
} from "@/components/catalog/catalog-feed";
import { CatalogSkeleton } from "@/components/catalog/catalog-skeleton";
import { HomePromoSection } from "@/components/home/home-promo-section";
import { getCategories, getFilterOptions } from "@/lib/data";

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
      {/* Tokopedia-Style Marketplace Promo Section */}
      <HomePromoSection />

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
                fallback={<CatalogSkeleton />}
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
