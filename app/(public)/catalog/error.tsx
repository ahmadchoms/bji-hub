"use client";

import { useEffect } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { ErrorState } from "@/components/shared/error-state";

export default function CatalogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Catalog page error:", error);
  }, [error]);

  return (
    <div className="py-16">
      <PageContainer>
        <ErrorState
          title="Terjadi Kendala Memuat Katalog"
          message={error.message || "Gagal mengambil data listing kopi. Silakan coba kembali."}
          onRetry={reset}
        />
      </PageContainer>
    </div>
  );
}
