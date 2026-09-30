import Link from "next/link";

// Bug 3 fix: replace router.push button with a plain <Link scroll={false}>.
// The server renders pages 1..N cumulatively via getCatalogFeed(filters, N),
// so items are never lost; back button works; no JS required.
export function LoadMore({ href }: { href: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      className="min-h-11 inline-flex items-center px-4 py-3 text-sm font-medium text-primary-600 hover:underline"
    >
      Muat lebih banyak
    </Link>
  );
}
