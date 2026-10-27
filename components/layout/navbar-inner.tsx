"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  LogOut,
  Search,
  Receipt,
  MessageSquare,
  Store,
  User,
  X,
  MapPin,
  Package,
  Heart,
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
import { logoutAction } from "@/actions/auth.actions";
import type { Role } from "@/lib/auth/roles";
import { CartNavBadge } from "@/components/cart/cart-nav-badge";
import { WishlistNavBadge } from "@/components/wishlist/wishlist-nav-badge";
import { NotificationBell } from "@/components/layout/notification-bell";
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
  activeOrdersCount?: number;
}

export function NavbarInner({
  role,
  categories = [],
  user,
  storeName,
  activeOrdersCount = 0,
}: NavbarInnerProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const storeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const storeMenuRef = useRef<HTMLDivElement>(null);
  const messagesMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on path changes
  useEffect(() => {
    setMobileOpen(false);
    setStoreOpen(false);
    setProfileOpen(false);
    setMessagesOpen(false);
  }, [pathname]);

  const handleClientLogout = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("biji_wishlist_items");
        localStorage.removeItem("biji_cart_items");
        localStorage.removeItem("biji_compare_items");
        window.dispatchEvent(new Event("biji-wishlist-changed"));
        window.dispatchEvent(new Event("biji-cart-changed"));
      } catch {
        // ignore: storage error during logout
      }
    }
  };

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
      if (
        messagesMenuRef.current &&
        !messagesMenuRef.current.contains(event.target as Node)
      ) {
        setMessagesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      router.push(`/?q=${encodeURIComponent(query)}`);
    } else {
      router.push("/");
    }
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
  const ordersHref = user ? "/orders" : "/login?next=/orders";

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
            <span className="text-neutral-500">Transaksi Belanja Kopi 100% Terverifikasi & Terjamin Aman</span>
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

          {/* Sisi Tengah: Input Search + Trending Chips */}
          <div className="flex-1 max-w-2xl mx-2 flex flex-col justify-center gap-1">
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
                  placeholder="Cari biji kopi specialty, proses, roastery..."
                  className="w-full h-9 pl-9 pr-8 rounded-md border border-neutral-200 bg-neutral-50/80 hover:bg-white focus:bg-white text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5"
                    title="Hapus pencarian"
                    aria-label="Hapus pencarian"
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

          {/* Sisi Kanan: Keranjang, Favorit, Notifikasi, Riwayat, Pesan | Toko | Profil */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Keranjang */}
            <CartNavBadge showBadge={role !== "guest"} />

            {/* Favorit / Wishlist */}
            <WishlistNavBadge showBadge={role !== "guest"} />

            {/* Notifikasi In-App (F1) */}
            {role !== "guest" && <NotificationBell />}

            {/* Riwayat */}
            <Link
              href={ordersHref}
              className="relative p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
              title={
                activeOrdersCount > 0
                  ? `Riwayat Pesanan (${activeOrdersCount} aktif)`
                  : "Riwayat Pesanan"
              }
              aria-label="Riwayat Pesanan"
            >
              <Receipt className="w-4 h-4" />
              {activeOrdersCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-in zoom-in-50">
                  {activeOrdersCount > 9 ? "9+" : activeOrdersCount}
                </span>
              )}
            </Link>

            {/* Pesan */}
            <div className="relative" ref={messagesMenuRef}>
              <button
                type="button"
                onClick={() => setMessagesOpen((prev) => !prev)}
                className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors relative"
                title="Pesan & Bantuan"
                aria-label="Pesan & Bantuan"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              </button>

              {messagesOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-72 rounded-md border border-neutral-200 bg-white p-3 shadow-lg z-50 animate-in fade-in-50 zoom-in-95 text-xs space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                    <span className="font-semibold text-neutral-900">Pesan & Layanan</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">
                      Online
                    </span>
                  </div>

                  <div className="space-y-2">
                    {isSeller ? (
                      <Link
                        href="/dashboard/inquiry"
                        onClick={() => setMessagesOpen(false)}
                        className="block p-2 rounded hover:bg-neutral-50 transition-colors border border-neutral-100"
                      >
                        <div className="flex items-center justify-between font-medium text-neutral-900">
                          <span>Inquiry Pembeli B2B</span>
                          <span className="text-[10px] text-amber-700 font-mono">Permintaan Sampel</span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Tinjau pesan dan permintaan penawaran grosir dari roastery atau cafe.
                        </p>
                      </Link>
                    ) : (
                      <Link
                        href="/orders"
                        onClick={() => setMessagesOpen(false)}
                        className="block p-2 rounded hover:bg-neutral-50 transition-colors border border-neutral-100"
                      >
                        <div className="flex items-center justify-between font-medium text-neutral-900">
                          <span>Hubungi Penjual</span>
                          <span className="text-[10px] text-neutral-400 font-mono">Pesanan</span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Kirim pesan WhatsApp langsung ke petani atau roastery penjual via kartu pesanan.
                        </p>
                      </Link>
                    )}

                    <a
                      href="https://wa.me/6281234567890?text=Halo%20Admin%20Biji%20Hub,%20saya%20membutuhkan%20bantuan%20terkait%20platform%20spesialisasi%20kopi."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 rounded bg-neutral-50 hover:bg-neutral-100 transition-colors border border-neutral-200"
                    >
                      <div className="flex items-center justify-between font-medium text-neutral-900">
                        <span>Customer Care Biji Hub</span>
                        <span className="text-[10px] text-emerald-700 font-mono">WhatsApp 24/7</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Tanyakan seputar pesanan, kurir, atau cara mendaftar toko kopi.
                      </p>
                    </a>
                  </div>
                </div>
              )}
            </div>

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
                <div className="w-6 h-6 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 text-neutral-600">
                  <Store className="w-3.5 h-3.5" />
                </div>
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
                      <div className="text-primary-700 font-semibold text-xs">
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
                  aria-label={`Akun: ${user.firstName}`}
                >
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user.firstName}
                      className="w-6 h-6 rounded-full object-cover shrink-0 border border-neutral-200"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 text-neutral-600">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <span className="truncate">{user.firstName}</span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 rounded-md border border-neutral-200 bg-white py-1.5 shadow-lg z-50 animate-in fade-in-50 zoom-in-95">
                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Profil Saya</span>
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      <Receipt className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Pesanan Saya</span>
                    </Link>
                    {isSeller && (
                      <Link
                        href="/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-primary-800 font-semibold hover:bg-primary-50 transition-colors"
                      >
                        <Store className="w-3.5 h-3.5 text-primary-600" />
                        <span>Dashboard Toko</span>
                      </Link>
                    )}
                    <div className="border-t border-neutral-100 my-1" />
                    <form action={logoutAction} onSubmit={handleClientLogout} className="w-full">
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
            <CartNavBadge showBadge={role !== "guest"} />
            <WishlistNavBadge showBadge={role !== "guest"} />

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
                          href={`/?category=${cat.slug}`}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-md"
                        >
                          <span>{cat.name}</span>
                        </Link>
                      ))}
                      <Link
                        href="/"
                        onClick={() => setMobileOpen(false)}
                        className="px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-50 rounded-md"
                      >
                        Semua Produk Kopi →
                      </Link>
                    </nav>
                  </div>

                  {/* Menu Akses Cepat */}
                  <div className="space-y-1 pt-3 border-t border-neutral-200/80">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold px-2">
                      Aktivitas & Akun
                    </p>

                    <Link
                      href="/wishlist"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-md"
                    >
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span>Kopi Favorit</span>
                    </Link>

                    <Link
                      href={ordersHref}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-md"
                    >
                      <div className="flex items-center gap-2.5">
                        <Receipt className="w-4 h-4 text-neutral-500" />
                        <span>Riwayat Pesanan</span>
                      </div>
                      {activeOrdersCount > 0 && (
                        <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {activeOrdersCount} aktif
                        </span>
                      )}
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
                      <form action={logoutAction} onSubmit={handleClientLogout}>
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
