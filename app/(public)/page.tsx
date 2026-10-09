import { Suspense } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { CatalogControls } from "@/components/catalog/catalog-controls";
import { CategoryTabs } from "@/components/catalog/product-feed";
import {
  CatalogFeed,
  parseFeedParams,
} from "@/components/catalog/catalog-feed";
import { ProductGridSkeleton } from "@/components/catalog/product-grid-skeleton";
import { TasteQuizModal } from "@/components/catalog/taste-quiz-modal";
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

  // Serialise raw params for the Suspense key and for CategoryTabs.
  // We pass the URLSearchParams to CategoryTabs so switching a tab preserves q, asal, etc.
  const serialized = new URLSearchParams(
    Object.entries(rawParams).flatMap(([key, value]) =>
      value === undefined
        ? []
        : [[key, Array.isArray(value) ? value[0] : value]],
    ),
  );

  return (
    <div>
      <CatalogControls
        origins={options.origins}
        processes={options.processes}
        roastLevels={options.roastLevels}
      />
      <div className="border-b border-neutral-200 bg-secondary-50/50 py-2.5">
        <PageContainer className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-neutral-700">
            <span className="text-base">☕</span>
            <span>
              <strong>Bingung pilih biji kopi?</strong> Ikuti kuis 30 detik untuk dapat rekomendasi beans sesuai alat seduh & seleramu.
            </span>
          </div>
          <TasteQuizModal triggerVariant="banner" />
        </PageContainer>
      </div>
      <CategoryTabs
        categories={categories}
        active={params.kategori}
        currentParams={serialized}
      />
      <PageContainer>
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
      </PageContainer>
    </div>
  );
}
