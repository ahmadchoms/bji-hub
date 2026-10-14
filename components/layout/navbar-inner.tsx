"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  LogOut,
  Search,
  ChevronDown,
  Bell,
  Receipt,
  MessageSquare,
  Store,
  User,
  Coffee,
  X,
  MapPin,
  Sparkles,
  Package,
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
import { cn } from "@/lib/utils";
import { logoutAction } from "@/actions/auth.actions";
import type { Role } from "@/lib/auth/roles";
import { CartNavBadge } from "@/components/cart/cart-nav-badge";
import type { Category } from "@/types";

const TRENDING_SEARCHES = [
  "Gayo Bourbon",
  "Kintamani",
  "Natural Anaerobic",
  "Drip Bag",
  "Robusta Dampit",
];

interface NavbarInnerProps {
  role: Role;
  categories: Category[];
  user: {
    firstName: string;
    avatarUrl?: string;
  } | null;
  storeName?: string | null;
}

export function NavbarInner({
  role,
  categories = [],
  user,
  storeName,
}: NavbarInnerProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const categoryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const storeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const storeMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on path changes
  useEffect(() => {
    setMobileOpen(false);
    setCategoryOpen(false);
    setStoreOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
      if (
        storeMenuRef.current &&
        !storeMenuRef.current.contains(event.target as Node)
      ) {
        setStoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      router.push(`/catalog?q=${encodeURIComponent(query)}`);
    } else {
      router.push("/catalog");
    }
  };

  const handleCategoryMouseEnter = () => {
    if (categoryTimeoutRef.current) clearTimeout(categoryTimeoutRef.current);
    setCategoryOpen(true);
  };

  const handleCategoryMouseLeave = () => {
    categoryTimeoutRef.current = setTimeout(() => {
      setCategoryOpen(false);
    }, 150);
  };

  const handleStoreMouseEnter = () => {
    if (storeTimeoutRef.current) clearTimeout(storeTimeoutRef.current);
    setStoreOpen(true);
  };

  const handleStoreMouseLeave = () => {
    storeTimeoutRef.current = setTimeout(() => {
      setStoreOpen(false);
    }, 150);
  };

  const isSeller = role === "seller";
  const ordersHref =
    role === "seller"
      ? "/dashboard/orders"
      : role === "buyer"
        ? "/orders"
        : "/login?next=/orders";

  const storeHref = isSeller ? "/dashboard" : "/open-store";
  const storeLabel = isSeller ? storeName || "Toko Saya" : "Toko";

  return (
    <>
      {/* Tokopedia-Style Top Sub-Navbar (Desktop) */}
      <div className="hidden md:block border-b border-neutral-200/70 bg-neutral-50/90 text-[11px] text-neutral-500 py-1 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-neutral-600 font-medium">
              <MapPin className="w-3 h-3 text-primary-600" />
              Dikirim ke: <strong className="text-neutral-800">Seluruh Indonesia</strong>
            </span>
            <span className="text-neutral-300">|</span>
            <span className="text-neutral-500">Rekening Escrow Biji Hub Terjamin 100% Aman</span>
          </div>
          <div className="flex items-center gap-4 text-neutral-600">
            <Link href="/about" className="hover:text-primary-700 transition-colors">
              Tentang Biji Hub
            </Link>
            <Link href="/pricing" className="hover:text-primary-700 transition-colors">
              Paket Penjual
            </Link>
            <Link href="/contact" className="hover:text-primary-700 transition-colors">
              Pusat Bantuan
            </Link>
          </div>
        </div>
      </div>

      {/* Main Desktop Header */}
      <header className="sticky top-0 z-40 hidden border-b border-neutral-200/80 bg-surface-base/95 backdrop-blur-md transition-all md:block">
        <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-5">
          {/* Sisi Kiri: Logo */}
          <div className="shrink-0 flex items-center">
            <Logo size="md" />
          </div>

          {/* Sisi Tengah: Dropdown Kategori + Input Search + Trending Chips */}
          <div className="flex-1 max-w-2xl mx-2 flex flex-col justify-center gap-1">
            <div className="flex items-center gap-2">
              {/* Dropdown Kategori (Hover & Click) */}
              <div
                className="relative shrink-0"
                onMouseEnter={handleCategoryMouseEnter}
                onMouseLeave={handleCategoryMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setCategoryOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                  aria-expanded={categoryOpen}
                >
                  <span>Kategori</span>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 text-neutral-500 transition-transform duration-150",
                      categoryOpen && "rotate-180",
                    )}
                  />
                </button>

                {categoryOpen && (
                  <div
                    className="absolute top-full left-0 mt-1 w-64 rounded-md border border-neutral-200 bg-white py-1.5 shadow-lg z-50 animate-in fade-in-50 zoom-in-95"
                    onMouseEnter={handleCategoryMouseEnter}
                    onMouseLeave={handleCategoryMouseLeave}
                  >
                    <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold border-b border-neutral-100 flex items-center gap-1.5">
                      <Coffee className="w-3.5 h-3.5 text-neutral-400" />
                      Kategori Kopi Specialty
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-neutral-50">
                      {categories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/catalog?kategori=${cat.slug}`}
                          onClick={() => setCategoryOpen(false)}
                          className="flex flex-col px-3 py-2 text-xs hover:bg-neutral-50 transition-colors"
                        >
                          <span className="font-semibold text-neutral-900">
                            {cat.name}
                          </span>
                          {cat.description && (
                            <span className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                              {cat.description}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-neutral-100 pt-1 mt-1 px-1">
                      <Link
                        href="/catalog"
                        onClick={() => setCategoryOpen(false)}
                        className="block px-2.5 py-1.5 text-xs font-semibold text-primary-700 hover:text-primary-800 hover:bg-primary-50 rounded"
                      >
                        Lihat Semua Katalog Kopi →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Search Form */}
              <form
                onSubmit={handleSearchSubmit}
                className="relative flex-1 w-full"
              >
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari biji kopi specialty, proses, roastery..."
                  className="w-full h-9 pl-9 pr-8 rounded-md border border-neutral-200 bg-neutral-50/80 hover:bg-white focus:bg-white text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5"
                    title="Hapus pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
            </div>

            {/* Trending Keywords Chips (Tokopedia Style) */}
            <div className="flex items-center gap-2 pl-2 text-[11px] text-neutral-500 overflow-hidden whitespace-nowrap">
              <span className="text-neutral-400 text-[10px] font-medium shrink-0">
                Pencarian populer:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                {TRENDING_SEARCHES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setSearchQuery(item);
                      router.push(`/catalog?q=${encodeURIComponent(item)}`);
                    }}
                    className="hover:text-primary-700 hover:underline transition-colors cursor-pointer shrink-0"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Keranjang, Notifikasi, Riwayat, Pesan | Toko | Profil */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Keranjang */}
            <CartNavBadge />

            {/* Notifikasi (dikerjakan nanti) */}
            <button
              type="button"
              className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors relative"
              title="Notifikasi (Fitur Segera Hadir)"
              aria-label="Notifikasi"
            >
              <Bell className="w-4 h-4" />
            </button>

            {/* Riwayat */}
            <Link
              href={ordersHref}
              className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
              title="Riwayat Pesanan"
              aria-label="Riwayat Pesanan"
            >
              <Receipt className="w-4 h-4" />
            </Link>

            {/* Pesan (dikerjakan nanti) */}
            <button
              type="button"
              className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors relative"
              title="Pesan Chat (Fitur Segera Hadir)"
              aria-label="Pesan Chat"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {/* Border Vertikal */}
            <div className="h-5 w-px bg-neutral-200 mx-1.5" />

            {/* Tombol Toko (Hover Dropdown) */}
            <div
              className="relative"
              ref={storeMenuRef}
              onMouseEnter={handleStoreMouseEnter}
              onMouseLeave={handleStoreMouseLeave}
            >
              <Link
                href={storeHref}
                onClick={() => setStoreOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors max-w-[150px]"
                title={isSeller ? storeLabel : "Buka Toko Mitra"}
              >
                <Store className="w-4 h-4 text-neutral-600 shrink-0" />
                <span className="truncate">{storeLabel}</span>
              </Link>

              {storeOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-56 rounded-md border border-neutral-200 bg-white p-3 shadow-lg z-50 animate-in fade-in-50 zoom-in-95 text-xs space-y-2"
                  onMouseEnter={handleStoreMouseEnter}
                  onMouseLeave={handleStoreMouseLeave}
                >
                  {isSeller ? (
                    <>
                      <div className="pb-2 border-b border-neutral-100">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block font-semibold">
                          Toko Terdaftar
                        </span>
                        <p className="font-bold text-neutral-900 text-sm truncate">
                          {storeLabel}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Link
                          href="/dashboard/listing"
                          onClick={() => setStoreOpen(false)}
                          className="flex items-center gap-2 p-1.5 rounded hover:bg-neutral-50 text-neutral-700"
                        >
                          <Package className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Kelola Produk / Jual Kopi</span>
                        </Link>
                        <Link
                          href="/dashboard/orders"
                          onClick={() => setStoreOpen(false)}
                          className="flex items-center gap-2 p-1.5 rounded hover:bg-neutral-50 text-neutral-700"
                        >
                          <Receipt className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Pesanan Toko Masuk</span>
                        </Link>
                        <Link
                          href="/dashboard/profile"
                          onClick={() => setStoreOpen(false)}
                          className="flex items-center gap-2 p-1.5 rounded hover:bg-neutral-50 text-neutral-700"
                        >
                          <Store className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Pengaturan Profil Toko</span>
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-primary-700 font-semibold">
                        <Sparkles className="w-4 h-4 text-primary-600" />
                        <span>Buka Toko Kopi Gratis</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 leading-relaxed">
                        Jual hasil panen kopi atau sangrai Anda ke ribuan roastery & pembeli di seluruh Indonesia tanpa biaya komisi.
                      </p>
                      <Link
                        href="/open-store"
                        onClick={() => setStoreOpen(false)}
                        className="block w-full py-1.5 text-center text-xs font-semibold rounded bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shadow-xs"
                      >
                        Buka Toko Mitra Sekarang →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tombol Profil */}
            {user ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors max-w-[140px]"
                  title={`Akun: ${user.firstName}`}
                >
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user.firstName}
                      className="w-5 h-5 rounded-full object-cover shrink-0 border border-neutral-200"
                    />
                  ) : (
                    <User className="w-4 h-4 text-neutral-600 shrink-0" />
                  )}
                  <span className="truncate">{user.firstName}</span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 rounded-md border border-neutral-200 bg-white py-1.5 shadow-lg z-50 animate-in fade-in-50 zoom-in-95">
                    <Link
                      href={
                        role === "seller" ? "/dashboard/profile" : "/profile"
                      }
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Profil Akun</span>
                    </Link>
                    <div className="border-t border-neutral-100 my-1" />
                    <form action={logoutAction} className="w-full">
                      <button
                        type="submit"
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Keluar Akun</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                title="Masuk ke Akun"
              >
                <User className="w-4 h-4 text-neutral-600" />
                <span>Masuk</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-surface-base/95 backdrop-blur-md md:hidden">
        <div className="flex h-14 items-center justify-between px-4 gap-2">
          <Logo size="md" />

          <div className="flex items-center gap-1.5">
            <CartNavBadge />

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
                    Menu & Navigasi
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col justify-between h-[calc(100vh-57px)] p-4 overflow-y-auto space-y-4">
                  {/* Search Mobile */}
                  <form onSubmit={handleSearchSubmit} className="relative w-full">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari kopi..."
                      className="w-full h-9 pl-9 pr-3 rounded-md border border-neutral-200 bg-neutral-50 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                    />
                  </form>

                  {/* Kategori Mobile */}
                  <div className="space-y-1">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold px-2">
                      Kategori Kopi
                    </p>
                    <nav className="flex flex-col gap-0.5">
                      {categories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/catalog?kategori=${cat.slug}`}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-md"
                        >
                          <span>{cat.name}</span>
                        </Link>
                      ))}
                      <Link
                        href="/catalog"
                        onClick={() => setMobileOpen(false)}
                        className="px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-50 rounded-md"
                      >
                        Semua Produk Katalog →
                      </Link>
                    </nav>
                  </div>

                  {/* Menu Akses Cepat */}
                  <div className="space-y-1 pt-3 border-t border-neutral-200/80">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold px-2">
                      Aktivitas & Akun
                    </p>

                    <Link
                      href={ordersHref}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-md"
                    >
                      <Receipt className="w-4 h-4 text-neutral-500" />
                      <span>Riwayat Pesanan</span>
                    </Link>

                    <Link
                      href={storeHref}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-md"
                    >
                      <Store className="w-4 h-4 text-neutral-500" />
                      <span>{storeLabel}</span>
                    </Link>

                    {user ? (
                      <Link
                        href={role === "seller" ? "/dashboard/profile" : "/profile"}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-md"
                      >
                        <User className="w-4 h-4 text-neutral-500" />
                        <span>Profil ({user.firstName})</span>
                      </Link>
                    ) : (
                      <Link
                        href="/login"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-md"
                      >
                        <User className="w-4 h-4 text-neutral-500" />
                        <span>Masuk ke Akun</span>
                      </Link>
                    )}
                  </div>

                  {/* Tombol Logout Mobile */}
                  {user && (
                    <div className="pt-4 border-t border-neutral-200/80">
                      <form action={logoutAction}>
                        <button
                          type="submit"
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-md"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Keluar dari Akun</span>
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
