"use client";

import { RouteError } from "@/components/shared/route-error";

export default function PublicError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError {...props} title="Gagal Memuat Halaman" />;
}
