import { PageContainer } from "@/components/layout/page-container";

export default function WishlistLoading() {
  return (
    <div className="py-8 md:py-12 bg-surface-alt min-h-[60vh]">
      <PageContainer className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-7 w-44 bg-neutral-200 rounded-xs" />
          <div className="h-4 w-72 bg-neutral-200 rounded-xs" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-surface-base border border-neutral-200 rounded-sm overflow-hidden space-y-3 p-3"
            >
              <div className="aspect-[4/3] w-full bg-neutral-200 rounded-xs" />
              <div className="h-4 w-3/4 bg-neutral-200 rounded-xs" />
              <div className="h-4 w-1/2 bg-neutral-200 rounded-xs" />
              <div className="h-8 w-full bg-neutral-100 rounded-xs" />
            </div>
          ))}
        </div>
      </PageContainer>
    </div>
  );
}
