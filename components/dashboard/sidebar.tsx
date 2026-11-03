"use client";

import {
  LayoutDashboard,
  BarChart3,
  ShoppingBag,
  WalletCards,
  MessageSquare,
  Coffee,
  Tag,
  Building2,
  CreditCard,
  Store,
  ShieldCheck,
} from "lucide-react";
import {
  DashboardShell,
  type DashboardNavItem,
} from "@/components/dashboard/dashboard-shell";

const SELLER_NAV: readonly DashboardNavItem[] = [
  // Utama
  { href: "/dashboard", label: "Ringkasan", icon: LayoutDashboard, group: "Utama" },
  { href: "/dashboard/analytics", label: "Analitik", icon: BarChart3, group: "Utama" },

  // Transaksi
  { href: "/dashboard/orders", label: "Pesanan Masuk", icon: ShoppingBag, group: "Transaksi" },
  { href: "/dashboard/payouts", label: "Pencairan Dana", icon: WalletCards, group: "Transaksi" },
  { href: "/dashboard/inquiry", label: "Pesan Masuk", icon: MessageSquare, group: "Transaksi" },

  // Produk & Promosi
  { href: "/dashboard/listing", label: "Produk Saya", icon: Coffee, group: "Produk & Promosi" },
  { href: "/dashboard/vouchers", label: "Voucher Promo", icon: Tag, group: "Produk & Promosi" },
  { href: "/dashboard/producers", label: "Kemitraan Petani", icon: Building2, group: "Produk & Promosi" },
  { href: "/dashboard/billing", label: "Langganan", icon: CreditCard, group: "Produk & Promosi" },

  // Pengaturan Toko
  { href: "/dashboard/profile", label: "Profil Toko", icon: Store, group: "Pengaturan Toko" },
  { href: "/dashboard/verification", label: "Verifikasi Toko", icon: ShieldCheck, group: "Pengaturan Toko" },
];

export function DashboardSidebar({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell nav={SELLER_NAV} rootHref="/dashboard" title="Penjual">
      {children}
    </DashboardShell>
  );
}
