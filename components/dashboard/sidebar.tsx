import {
  DashboardShell,
  type DashboardNavItem,
} from "@/components/dashboard/dashboard-shell";

const SELLER_NAV: readonly DashboardNavItem[] = [
  { href: "/dashboard", label: "Ringkasan" },
  { href: "/dashboard/listing", label: "Produk Saya" },
  { href: "/dashboard/analytics", label: "Analitik" },
  { href: "/dashboard/billing", label: "Langganan" },
  { href: "/dashboard/profile", label: "Profil Toko" },
  { href: "/dashboard/inquiry", label: "Pesan Masuk" },
];

export function DashboardSidebar({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell nav={SELLER_NAV} rootHref="/dashboard" title="Penjual">
      {children}
    </DashboardShell>
  );
}
