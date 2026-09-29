import { Suspense } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { CatalogControls } from "@/components/catalog/catalog-controls";
import { CategoryTabs } from "@/components/catalog/product-feed";
import { CatalogFeed, parseFeedParams } from "@/components/catalog/catalog-feed";
import { ProductGridSkeleton } from "@/components/catalog/product-grid-skeleton";
import { getCategories, getFilterOptions } from "@/lib/mock/repository";

interface HomePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const rawParams = await searchParams;
  const params = parseFeedParams(rawParams);
  const [categories, options] = await Promise.all([getCategories(), getFilterOptions()]);
  const serialized = new URLSearchParams(Object.entries(rawParams).flatMap(([key, value]) => value === undefined ? [] : [[key, Array.isArray(value) ? value[0] : value]])).toString();

  return (
    <div>
      <CatalogControls origins={options.origins} processes={options.processes} roastLevels={options.roastLevels} />
      <CategoryTabs categories={categories} active={params.kategori} />
      <PageContainer>
        <Suspense key={serialized} fallback={<div className="py-4"><ProductGridSkeleton /></div>}>
          <CatalogFeed params={params} />
        </Suspense>
      </PageContainer>
    </div>
  );
}
