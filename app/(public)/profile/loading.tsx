import { PageContainer } from "@/components/layout/page-container";

export default function ProfileLoading() {
  return (
    <div className="py-8 md:py-12 bg-surface-alt min-h-[60vh]">
      <PageContainer className="space-y-6 animate-pulse max-w-4xl">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-neutral-200 rounded-xs" />
          <div className="h-4 w-64 bg-neutral-200 rounded-xs" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-4 bg-surface-base border border-neutral-200 rounded-sm p-5 space-y-4">
            <div className="w-20 h-20 bg-neutral-200 rounded-full mx-auto" />
            <div className="h-5 w-32 bg-neutral-200 rounded-xs mx-auto" />
            <div className="h-4 w-44 bg-neutral-200 rounded-xs mx-auto" />
          </div>
          <div className="md:col-span-8 bg-surface-base border border-neutral-200 rounded-sm p-6 space-y-4">
            <div className="h-5 w-36 bg-neutral-200 rounded-xs" />
            <div className="space-y-3 pt-2">
              <div className="h-10 w-full bg-neutral-100 rounded-xs" />
              <div className="h-10 w-full bg-neutral-100 rounded-xs" />
              <div className="h-24 w-full bg-neutral-100 rounded-xs" />
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
