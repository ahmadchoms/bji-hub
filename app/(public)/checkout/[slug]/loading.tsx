import { PageContainer } from "@/components/layout/page-container";

export default function CheckoutLoading() {
  return (
    <div className="py-8 md:py-12 bg-surface-alt min-h-[70vh]">
      <PageContainer className="space-y-6 animate-pulse max-w-5xl">
        <div className="space-y-2">
          <div className="h-7 w-44 bg-neutral-200 rounded-xs" />
          <div className="h-4 w-60 bg-neutral-200 rounded-xs" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-surface-base border border-neutral-200 rounded-sm p-5 space-y-4">
              <div className="h-5 w-36 bg-neutral-200 rounded-xs" />
              <div className="h-28 bg-neutral-100 rounded-xs" />
            </div>
            <div className="bg-surface-base border border-neutral-200 rounded-sm p-5 space-y-4">
              <div className="h-5 w-40 bg-neutral-200 rounded-xs" />
              <div className="h-32 bg-neutral-100 rounded-xs" />
            </div>
          </div>
          <div className="lg:col-span-5 bg-surface-base border border-neutral-200 rounded-sm p-5 space-y-4">
            <div className="h-5 w-44 bg-neutral-200 rounded-xs" />
            <div className="h-36 bg-neutral-100 rounded-xs" />
            <div className="h-10 w-full bg-neutral-200 rounded-xs" />
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
