"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Receipt,
  MessageSquare,
  Store,
  User,
  LogOut,
  Package,
} from "lucide-react";
import { NotificationBell } from "@/components/layout/notification-bell";
import { logoutAction } from "@/actions/auth.actions";
import type { Role } from "@/lib/auth/roles";

export interface NavbarAuthState {
  isLoading: boolean;
  authenticated: boolean;
  role: Role;
  user: {
    firstName: string;
    avatarUrl?: string;
  } | null;
  storeName: string | null;
  activeOrdersCount: number;
  unreadCount: number;
}

export function useNavbarAuth(): NavbarAuthState {
  const [state, setState] = useState<NavbarAuthState>({
    isLoading: true,
    authenticated: false,
    role: "guest",
    user: null,
    storeName: null,
    activeOrdersCount: 0,
    unreadCount: 0,
  });

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/me", {
      credentials: "same-origin",
      signal: controller.signal,
      headers: { credentials: "same-origin" },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch session");
        return res.json();
      })
      .then((data) => {
        setState({
          isLoading: false,
          authenticated: Boolean(data.authenticated),
          role: (data.role as Role) || (data.authenticated ? "buyer" : "guest"),
          user: data.user || null,
          storeName: data.storeName || null,
          activeOrdersCount: Number(data.activeOrdersCount) || 0,
          unreadCount: Number(data.unreadCount) || 0,
        });
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setState((prev) => ({ ...prev, isLoading: false }));
      });

    return () => controller.abort();
  }, []);

  return state;
}

function handleClientLogout() {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("biji_wishlist_items");
      localStorage.removeItem("biji_cart_items");
      localStorage.removeItem("biji_compare_items");
      window.dispatchEvent(new Event("biji-wishlist-changed"));
      window.dispatchEvent(new Event("biji-cart-changed"));
    } catch {
      // ignore storage errors
    }
  }
}

export function NavbarAuth({
  auth,
}: {
  auth?: NavbarAuthState;
}) {
  const fetched = useNavbarAuth();
  const current = auth || fetched;
  const { isLoading, authenticated, role, user, storeName, activeOrdersCount } =
    current;

  const pathname = usePathname();
  const [storeOpen, setStoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);

  const storeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const storeMenuRef = useRef<HTMLDivElement>(null);
  const messagesMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStoreOpen(false);
    setProfileOpen(false);
    setMessagesOpen(false);
  }, [pathname]);

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

  const handleStoreMouseEnter = () => {
    if (storeTimeoutRef.current) clearTimeout(storeTimeoutRef.current);
    setStoreOpen(true);
  };

  const handleStoreMouseLeave = () => {
    storeTimeoutRef.current = setTimeout(() => {
      setStoreOpen(false);
    }, 150);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2" aria-busy="true">
        <div className="h-8 w-8 rounded-md bg-neutral-100 animate-pulse" />
        <div className="h-5 w-px bg-neutral-200 mx-1" />
        <div className="h-8 w-16 rounded-md bg-neutral-100 animate-pulse" />
        <div className="h-8 w-16 rounded-md bg-neutral-100 animate-pulse" />
      </div>
    );
  }

  const isSeller = role === "seller";
  const ordersHref = authenticated ? "/orders" : "/login?next=/orders";
  const storeHref = isSeller ? "/dashboard" : "/open-store";
  const storeLabel = isSeller ? storeName || "Toko Saya" : "Toko";

  return (
    <div className="flex items-center gap-1">
      {/* Notifikasi In-App */}
      {authenticated && <NotificationBell />}

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
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 animate-in zoom-in-50">
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
              <span className="font-semibold text-neutral-900">
                Pesan & Layanan
              </span>
              <span className="text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">
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
                    <span className="text-xs text-amber-700 font-mono">
                      Permintaan Sampel
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 mt-0.5">
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
                    <span className="text-xs text-neutral-400 font-mono">
                      Pesanan
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 mt-0.5">
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
                  <span className="text-xs text-emerald-700 font-mono">
                    WhatsApp 24/7
                  </span>
                </div>
                <p className="text-xs text-neutral-600 mt-0.5">
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
                  <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 block font-semibold">
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
                    <Package className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Kelola Produk / Jual Kopi</span>
                  </Link>
                  <Link
                    href="/dashboard/orders"
                    onClick={() => setStoreOpen(false)}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-neutral-50 text-neutral-700"
                  >
                    <Receipt className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Pesanan Toko Masuk</span>
                  </Link>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setStoreOpen(false)}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-neutral-50 text-neutral-700"
                  >
                    <Store className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Pengaturan Profil Toko</span>
                  </Link>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <div className="text-primary-700 font-semibold text-xs">
                  <span>Buka Toko Kopi</span>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Jual hasil panen kopi atau sangrai Anda ke ribuan roastery & pembeli di seluruh Indonesia.
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
                <User className="w-3.5 h-3.5 text-neutral-600" />
                <span>Profil Saya</span>
              </Link>
              <Link
                href="/orders"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <Receipt className="w-3.5 h-3.5 text-neutral-600" />
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
  );
}

export function NavbarAuthMobile({
  auth,
  onClose,
}: {
  auth?: NavbarAuthState;
  onClose?: () => void;
}) {
  const fetched = useNavbarAuth();
  const current = auth || fetched;
  const { isLoading, authenticated, role, user, storeName, activeOrdersCount } =
    current;

  const isSeller = role === "seller";
  const ordersHref = authenticated ? "/orders" : "/login?next=/orders";
  const storeHref = isSeller ? "/dashboard" : "/open-store";
  const storeLabel = isSeller ? storeName || "Toko Saya" : "Buka Toko Mitra";

  if (isLoading) {
    return (
      <div className="space-y-2 py-2">
        <div className="h-8 w-full rounded-md bg-neutral-100 animate-pulse" />
        <div className="h-8 w-full rounded-md bg-neutral-100 animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <Link
        href={ordersHref}
        onClick={onClose}
        className="flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-md"
      >
        <div className="flex items-center gap-2.5">
          <Receipt className="w-4 h-4 text-neutral-600" />
          <span>Riwayat Pesanan</span>
        </div>
        {activeOrdersCount > 0 && (
          <span className="bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            {activeOrdersCount} aktif
          </span>
        )}
      </Link>

      <Link
        href={storeHref}
        onClick={onClose}
        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-md"
      >
        <Store className="w-4 h-4 text-neutral-600" />
        <span>{storeLabel}</span>
      </Link>

      {user ? (
        <Link
          href={role === "seller" ? "/dashboard/profile" : "/profile"}
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-md"
        >
          <User className="w-4 h-4 text-neutral-600" />
          <span>Profil ({user.firstName})</span>
        </Link>
      ) : (
        <Link
          href="/login"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-md"
        >
          <User className="w-4 h-4 text-neutral-600" />
          <span>Masuk ke Akun</span>
        </Link>
      )}

      {authenticated && (
        <div className="pt-4 border-t border-neutral-200/80">
          <form
            action={logoutAction}
            onSubmit={() => {
              handleClientLogout();
              onClose?.();
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar dari Akun</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
