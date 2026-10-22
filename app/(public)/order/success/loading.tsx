import { PageContainer } from "@/components/layout/page-container";

export default function OrderSuccessLoading() {
  return (
    <div className="py-12 md:py-16 bg-surface-alt min-h-[70vh]">
      <PageContainer className="max-w-2xl mx-auto space-y-6 animate-pulse">
        <div className="bg-surface-base border border-neutral-200 rounded-sm p-6 sm:p-8 space-y-6">
          <div className="w-16 h-16 bg-neutral-200 rounded-full mx-auto" />
          <div className="space-y-2 text-center">
            <div className="h-6 w-48 bg-neutral-200 rounded-xs mx-auto" />
            <div className="h-4 w-72 bg-neutral-200 rounded-xs mx-auto" />
          </div>
          <div className="h-44 bg-neutral-100 rounded-xs" />
          <div className="flex gap-4">
            <div className="h-10 flex-1 bg-neutral-200 rounded-xs" />
            <div className="h-10 flex-1 bg-neutral-200 rounded-xs" />
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
