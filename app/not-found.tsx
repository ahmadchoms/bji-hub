import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PublicShell>
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-start justify-center gap-4 px-4 py-16">
        <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          Kode 404
        </p>
        <h1 className="font-display text-3xl font-semibold text-neutral-900">
          Halaman tidak ditemukan
        </h1>
        <p className="text-sm text-neutral-600">
          Alamat yang Anda buka tidak ada atau sudah dipindahkan.
        </p>
        <Link
          href="/"
          className={buttonVariants({ variant: "primary", size: "md" })}
        >
          Ke beranda
        </Link>
      </div>
    </PublicShell>
  );
}
