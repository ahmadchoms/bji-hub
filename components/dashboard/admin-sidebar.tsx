"use client";

import {
  LayoutDashboard,
  Receipt,
  RotateCcw,
  WalletCards,
  ShieldCheck,
  Coffee,
  Star,
  Tag,
  MapPin,
  Building2,
  ScrollText,
  Wrench,
} from "lucide-react";
import {
  DashboardShell,
  type DashboardNavItem,
} from "@/components/dashboard/dashboard-shell";

const ADMIN_NAV: readonly DashboardNavItem[] = [
  // Utama
  { href: "/admin", label: "Ringkasan", icon: LayoutDashboard, group: "Utama" },

  // Transaksi
  { href: "/admin/transactions", label: "Riwayat Transaksi", icon: Receipt, group: "Transaksi" },
  { href: "/admin/refunds", label: "Antrean Refund", icon: RotateCcw, group: "Transaksi" },
  { href: "/admin/payouts", label: "Pencairan Dana", icon: WalletCards, group: "Transaksi" },

  // Katalog & Mitra
  { href: "/admin/verification", label: "Antrean Verifikasi", icon: ShieldCheck, group: "Katalog & Mitra" },
  { href: "/admin/moderation", label: "Moderasi Produk", icon: Coffee, group: "Katalog & Mitra" },
  { href: "/admin/reviews", label: "Moderasi Ulasan", icon: Star, group: "Katalog & Mitra" },
  { href: "/admin/vouchers", label: "Kelola Voucher", icon: Tag, group: "Katalog & Mitra" },
  { href: "/admin/origins", label: "Master Asal Kopi", icon: MapPin, group: "Katalog & Mitra" },
  { href: "/admin/producers", label: "Master Produser", icon: Building2, group: "Katalog & Mitra" },

  // Sistem
  { href: "/admin/audit-logs", label: "Audit Log", icon: ScrollText, group: "Sistem" },
  { href: "/admin/maintenance", label: "Pemeliharaan", icon: Wrench, group: "Sistem" },
];

export function AdminSidebar({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell nav={ADMIN_NAV} rootHref="/admin">
      {children}
    </DashboardShell>
  );
}
