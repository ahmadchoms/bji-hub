"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <ErrorState
        title="Gagal Memuat Admin Panel"
        message={error.message}
        onRetry={reset}
      />
    </div>
  );
}
