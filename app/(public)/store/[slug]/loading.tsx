import { PageContainer } from "@/components/layout/page-container";

export default function StoreLoading() {
  return (
    <div className="py-8 md:py-12">
      <PageContainer className="space-y-8 animate-pulse">
        <div className="h-3 w-48 bg-neutral-200 rounded-xs" />
        <div className="h-56 w-full bg-neutral-200 rounded-xs" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="h-64 bg-neutral-200 rounded-xs" />
          <div className="h-64 bg-neutral-200 rounded-xs" />
          <div className="h-64 bg-neutral-200 rounded-xs" />
        </div>
      </PageContainer>
    </div>
  );
}