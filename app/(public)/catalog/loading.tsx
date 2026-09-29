import { PageContainer } from "@/components/layout/page-container";
import { ListingGrid } from "@/components/catalog/listing-grid";

export default function CatalogLoading() {
  return (
    <div className="py-8 md:py-12">
      <PageContainer className="space-y-8">
        <div className="border-b border-neutral-300 pb-6 space-y-2 animate-pulse">
          <div className="h-8 w-72 bg-neutral-200 rounded-xs" />
          <div className="h-3 w-96 bg-neutral-200 rounded-xs" />
        </div>
        <div className="flex flex-col lg:flex-row items-start gap-8">
          <div className="hidden lg:block w-64 h-80 bg-neutral-200 rounded-xs animate-pulse" />
          <div className="flex-1 w-full space-y-6">
            <div className="h-10 w-full max-w-md bg-neutral-200 rounded-xs animate-pulse" />
            <ListingGrid isLoading skeletonCount={6} />
          </div>
        </div>
      </PageContainer>
    </div>
  );
}