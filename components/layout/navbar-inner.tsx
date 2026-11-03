"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  Search,
  X,
  MapPin,
  Heart,
  Globe,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Role } from "@/lib/auth/roles";
import { CartNavBadge } from "@/components/cart/cart-nav-badge";
import { WishlistNavBadge } from "@/components/wishlist/wishlist-nav-badge";
import {
  NavbarAuth,
  NavbarAuthMobile,
  useNavbarAuth,
  type NavbarAuthState,
} from "@/components/layout/navbar-auth";
import type { Category } from "@/types";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { t } from "@/lib/i18n";

const TRENDING_SEARCHES = [
  "Gayo Bourbon",
  "Kintamani",
  "Natural Anaerobic",
  "Drip Bag",
  "Robusta Dampit",
];

interface NavbarInnerProps {
  categories: Category[];
  locale?: "id" | "en";
  role?: Role;
  user?: {
    firstName: string;
    avatarUrl?: string;
  } | null;
  storeName?: string | null;
  activeOrdersCount?: number;
}

export function NavbarInner({
  categories = [],
  locale = "id",
  role: initialRole,
  user: initialUser,
  storeName: initialStoreName,
  activeOrdersCount: initialActiveOrdersCount,
}: NavbarInnerProps) {
  const pathname = usePathname();
  const router = useRouter();

  const fetchedAuth = useNavbarAuth();
  // If initial props are passed (e.g. from tests or mock), use them, otherwise use client-fetched state
  const auth: NavbarAuthState = initialRole !== undefined
    ? {
        isLoading: false,
        authenticated: initialRole !== "guest",
        role: initialRole,
        user: initialUser || null,
        storeName: initialStoreName || null,
        activeOrdersCount: initialActiveOrdersCount || 0,
        unreadCount: 0,
      }
    : fetchedAuth;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Close mobile sheet on path changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      router.push(`/?q=${encodeURIComponent(query)}`);
    } else {
      router.push("/");
    }
  };

  return (
    <>
      {/* Tokopedia-Style Top Sub-Navbar (Desktop) */}
      <div className="hidden lg:block border-b border-neutral-200/70 bg-neutral-50/90 text-xs text-neutral-600 py-1 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 truncate min-w-0">
            <span className="flex items-center gap-1 text-neutral-600 font-medium shrink-0">
              <MapPin className="w-3 h-3 text-primary-600" />
              {locale === "en" ? (
                <>Delivered to: <strong className="text-neutral-800">Across Indonesia</strong></>
              ) : (
                <>Dikirim ke: <strong className="text-neutral-800">Seluruh Indonesia</strong></>
              )}
            </span>
            <span className="text-neutral-300">|</span>
            <span className="text-neutral-600 truncate">
              {locale === "en"
                ? "100% Verified & Secure Direct Coffee Marketplace"
                : "Transaksi Belanja Kopi 100% Terverifikasi & Terjamin Aman"}
            </span>
          </div>
          <div className="flex items-center gap-4 text-neutral-600 shrink-0">
            <Link href="/about" className="hover:text-primary-700 transition-colors">
              {locale === "en" ? "About Us" : "Tentang Biji Hub"}
            </Link>
            <Link href="/peta-rasa" className="hover:text-primary-700 transition-colors">
              {locale === "en" ? "Taste Map" : "Peta Rasa"}
            </Link>
            <Link href="/belajar" className="hover:text-primary-700 transition-colors">
              {t("nav.learn", locale)}
            </Link>
            <Link href="/pricing" className="hover:text-primary-700 transition-colors">
              {locale === "en" ? "Seller Plans" : "Paket Penjual"}
            </Link>
            <Link href="/contact" className="hover:text-primary-700 transition-colors">
              {locale === "en" ? "Help Center" : "Pusat Bantuan"}
            </Link>
            <LanguageSwitcher currentLocale={locale} />
          </div>
        </div>
      </div>

      {/* Main Desktop Header */}
      <header className="sticky top-0 z-40 hidden border-b border-neutral-200/80 bg-surface-base/95 backdrop-blur-md transition-all lg:block">
        <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-5">
          {/* Sisi Kiri: Logo */}
          <div className="shrink-0 flex items-center">
            <Logo size="md" />
          </div>

          {/* Sisi Tengah: Input Search + Trending Chips */}
          <div className="flex-1 min-w-0 max-w-2xl mx-2 flex flex-col justify-center gap-1">
            <div className="flex items-center w-full">
              {/* Input Search Form */}
              <form
                onSubmit={handleSearchSubmit}
                className="relative w-full"
              >
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    locale === "en"
                      ? "Search specialty coffee, process, roastery..."
                      : "Cari biji kopi specialty, proses, roastery..."
                  }
                  className="w-full h-9 pl-9 pr-8 rounded-md border border-neutral-200 bg-neutral-50/80 hover:bg-white focus:bg-white text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5"
                    title={locale === "en" ? "Clear search" : "Hapus pencarian"}
                    aria-label={locale === "en" ? "Clear search" : "Hapus pencarian"}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
            </div>

            {/* Trending Keywords Chips */}
            <div className="flex items-center gap-2 pl-2 text-xs text-neutral-600 overflow-hidden whitespace-nowrap">
              <span className="text-neutral-400 text-xs font-medium shrink-0">
                {locale === "en" ? "Popular searches:" : "Pencarian populer:"}
              </span>
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                {TRENDING_SEARCHES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setSearchQuery(item);
                      router.push(`/?q=${encodeURIComponent(item)}`);
                    }}
                    className="hover:text-primary-700 hover:underline transition-colors cursor-pointer shrink-0"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Keranjang, Favorit, dan Pulau Auth */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Keranjang */}
            <CartNavBadge showBadge={auth.authenticated} />

            {/* Favorit / Wishlist */}
            <WishlistNavBadge showBadge={auth.authenticated} />

            {/* Pulau Auth Dinamis */}
            <NavbarAuth auth={auth} locale={locale} />
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-surface-base/95 backdrop-blur-md lg:hidden">
        <div className="flex h-14 items-center justify-between px-4 gap-2">
          <Logo size="md" />

          <div className="flex items-center gap-1.5">
            <LanguageSwitcher currentLocale={locale} />
            <CartNavBadge showBadge={auth.authenticated} />
            <WishlistNavBadge showBadge={auth.authenticated} />

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Menu"
                    className="rounded-md hover:bg-neutral-100"
                  />
                }
              >
                <Menu className="h-5 w-5 text-neutral-700" />
              </SheetTrigger>

              <SheetContent side="right" className="w-80 p-0 sm:max-w-xs">
                <SheetHeader className="border-b border-neutral-200/80 p-4 text-left">
                  <SheetTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    {locale === "en" ? "Menu & Navigation" : "Menu & Navigasi"}
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col justify-start h-[calc(100vh-57px)] p-4 overflow-y-auto space-y-4">
                  {/* Search Mobile */}
                  <form onSubmit={handleSearchSubmit} className="relative w-full">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={locale === "en" ? "Search coffee..." : "Cari kopi..."}
                      className="w-full h-9 pl-9 pr-3 rounded-md border border-neutral-200 bg-neutral-50 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                    />
                  </form>

                  {/* Kategori Mobile */}
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wider text-neutral-600 font-semibold px-2">
                      {locale === "en" ? "Categories" : "Kategori Kopi"}
                    </p>
                    <nav className="flex flex-col gap-0.5">
                      {categories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/?category=${cat.slug}`}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-md"
                        >
                          <span>{cat.name}</span>
                        </Link>
                      ))}
                      <Link
                        href="/asal-kopi"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-md coarse:min-h-11"
                      >
                        <span>{t("nav.origins", locale)}</span>
                      </Link>
                      <Link
                        href="/peta-rasa"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-md coarse:min-h-11"
                      >
                        <span>{locale === "en" ? "Taste Map" : "Peta Sebaran Rasa (Taste Map)"}</span>
                      </Link>
                      <Link
                        href="/belajar"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-md coarse:min-h-11"
                      >
                        <span>{t("nav.learn", locale)}</span>
                      </Link>
                      <Link
                        href="/"
                        onClick={() => setMobileOpen(false)}
                        className="px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-50 rounded-md coarse:min-h-11 flex items-center"
                      >
                        {locale === "en" ? "All Coffee Products →" : "Semua Produk Kopi →"}
                      </Link>
                    </nav>
                  </div>

                  {/* Menu Akses Cepat */}
                  <div className="space-y-1 pt-3 border-t border-neutral-200/80">
                    <p className="text-xs uppercase tracking-wider text-neutral-600 font-semibold px-2">
                      {locale === "en" ? "Activity & Account" : "Aktivitas & Akun"}
                    </p>

                    <Link
                      href="/wishlist"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-md"
                    >
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span>{locale === "en" ? "Saved Coffee" : "Kopi Favorit"}</span>
                    </Link>

                    {/* Dynamic Auth & Mobile Navigation */}
                    <NavbarAuthMobile
                      auth={auth}
                      locale={locale}
                      onClose={() => setMobileOpen(false)}
                    />
                  </div>

                  {/* Pilihan Bahasa Mobile */}
                  <div className="pt-3 border-t border-neutral-200/80 flex items-center justify-between px-2">
                    <span className="text-xs font-medium text-neutral-600 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-neutral-600" />
                      {locale === "en" ? "Language" : "Pilihan Bahasa"}
                    </span>
                    <LanguageSwitcher currentLocale={locale} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
