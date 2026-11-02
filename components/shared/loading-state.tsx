import { Loader2 } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";

export function LoadingState({ message = "Memuat data..." }: { message?: string }) {
  return (
    <div className="py-20 md:py-28 min-h-[60vh] flex items-center justify-center text-center bg-surface-alt">
      <PageContainer className="max-w-md mx-auto space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
        <p className="text-xs font-medium text-neutral-600">{message}</p>
      </PageContainer>
    </div>
  );
}
