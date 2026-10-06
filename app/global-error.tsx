"use client";

import "./globals.css";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="bg-surface-alt text-neutral-900">
        <div className="mx-auto flex min-h-screen max-w-xl flex-col items-start justify-center gap-4 px-4">
          <h1 className="text-2xl font-semibold">Terjadi kesalahan</h1>
          <p className="text-sm text-neutral-600">
            Halaman tidak dapat ditampilkan. Silakan coba lagi.
          </p>
          <button
            type="button"
            onClick={reset}
            className="min-h-11 bg-primary-600 px-4 text-sm font-medium text-white hover:bg-primary-700"
          >
            Coba lagi
          </button>
        </div>
      </body>
    </html>
  );
}
