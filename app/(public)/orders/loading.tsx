import { PageContainer } from "@/components/layout/page-container";

export default function OrdersLoading() {
  return (
    <div className="py-8 md:py-12 bg-surface-alt min-h-[60vh]">
      <PageContainer className="space-y-6 animate-pulse max-w-4xl">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-neutral-200 rounded-xs" />
          <div className="h-4 w-72 bg-neutral-200 rounded-xs" />
        </div>
        <div className="h-10 w-full max-w-md bg-neutral-200 rounded-xs" />
        <div className="space-y-4 pt-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface-base border border-neutral-200 rounded-sm p-4 space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 w-32 bg-neutral-200 rounded-xs" />
                <div className="h-4 w-20 bg-neutral-200 rounded-xs" />
              </div>
              <div className="h-12 w-full bg-neutral-100 rounded-xs" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-4 w-24 bg-neutral-200 rounded-xs" />
                <div className="h-7 w-28 bg-neutral-200 rounded-xs" />
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    </div>
  );
}
