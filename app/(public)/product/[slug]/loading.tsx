import { PageContainer } from "@/components/layout/page-container";

export default function ProductLoading() {
  return (
    <div className="py-8 md:py-12">
      <PageContainer className="space-y-8 animate-pulse">
        <div className="h-3 w-64 bg-neutral-200 rounded-xs" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="aspect-[4/3] w-full bg-neutral-200 rounded-xs" />
            <div className="h-32 bg-neutral-200 rounded-xs" />
          </div>
          <div className="lg:col-span-5 space-y-6">
            <div className="h-96 bg-neutral-200 rounded-xs" />
          </div>
        </div>
      </PageContainer>
    </div>
  );
}