import Link from "next/link";
import { getServerLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";

export async function Footer() {
  const locale = await getServerLocale();

  return (
    <footer className="border-t border-neutral-300 py-5">
      <nav
        className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 text-xs text-neutral-600 sm:px-6 lg:px-8"
        aria-label="Footer"
      >
        <Link href="/about" className="hover:text-primary-900 coarse:min-h-11 inline-flex items-center">
          {locale === "en" ? "About Us" : "Tentang"}
        </Link>
        <Link href="/asal-kopi" className="hover:text-primary-900 coarse:min-h-11 inline-flex items-center">
          {t("nav.origins", locale)}
        </Link>
        <Link href="/contact" className="hover:text-primary-900">
          {locale === "en" ? "Contact" : "Kontak"}
        </Link>
        <Link href="/terms" className="hover:text-primary-900">
          {t("footer.terms", locale)}
        </Link>
        <Link href="/privacy" className="hover:text-primary-900">
          {t("footer.privacy", locale)}
        </Link>
        <Link href="/refund-policy" className="hover:text-primary-900">
          {locale === "en" ? "Returns & Refunds" : "Retur & Refund"}
        </Link>
        <Link href="/shipping-policy" className="hover:text-primary-900">
          {locale === "en" ? "Shipping Policy" : "Pengiriman"}
        </Link>
        <Link href="/pricing" className="hover:text-primary-900">
          {locale === "en" ? "Seller Pricing" : "Harga"}
        </Link>
        <Link href="/register?role=seller" className="hover:text-primary-900">
          {locale === "en" ? "Sell Coffee" : "Jual Kopi"}
        </Link>
      </nav>
    </footer>
  );
}
