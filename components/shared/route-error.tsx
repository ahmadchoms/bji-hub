"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/error-state";

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}

export function RouteError({
  error,
  reset,
  title = "Gagal Memuat Halaman",
}: RouteErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <ErrorState
        title={title}
        message={`Terjadi kendala saat mengambil data. Silakan coba lagi.${error.digest ? ` Kode: ${error.digest}` : ""}`}
        onRetry={reset}
      />
    </div>
  );
}
