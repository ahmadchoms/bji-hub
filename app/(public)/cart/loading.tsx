import { PageContainer } from "@/components/layout/page-container";

export default function CartLoading() {
  return (
    <div className="py-8 md:py-12 bg-surface-alt min-h-[60vh]">
      <PageContainer className="space-y-6 animate-pulse max-w-5xl">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-neutral-200 rounded-xs" />
          <div className="h-4 w-64 bg-neutral-200 rounded-xs" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
          <div className="lg:col-span-8 space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-surface-base border border-neutral-200 rounded-sm p-4 space-y-4"
              >
                <div className="h-5 w-40 bg-neutral-200 rounded-xs" />
                <div className="flex gap-4 items-center">
                  <div className="w-20 h-20 bg-neutral-200 rounded-xs shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-3/4 bg-neutral-200 rounded-xs" />
                    <div className="h-4 w-1/3 bg-neutral-200 rounded-xs" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-4 bg-surface-base border border-neutral-200 rounded-sm p-5 space-y-4">
            <div className="h-5 w-36 bg-neutral-200 rounded-xs" />
            <div className="h-20 bg-neutral-100 rounded-xs" />
            <div className="h-10 w-full bg-neutral-200 rounded-xs" />
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
