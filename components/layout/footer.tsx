import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-neutral-300 py-5">
      <nav
        className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 text-xs text-neutral-600 sm:px-6 lg:px-8"
        aria-label="Footer"
      >
        <Link href="/about" className="hover:text-primary-900">
          Tentang
        </Link>
        <Link href="/contact" className="hover:text-primary-900">
          Kontak
        </Link>
        <Link href="/terms" className="hover:text-primary-900">
          Syarat
        </Link>
        <Link href="/pricing" className="hover:text-primary-900">
          Harga
        </Link>
        <Link href="/register?role=seller" className="hover:text-primary-900">
          Jual Kopi
        </Link>
      </nav>
    </footer>
  );
}
