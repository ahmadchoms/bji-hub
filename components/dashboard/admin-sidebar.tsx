import {
  DashboardShell,
  type DashboardNavItem,
} from "@/components/dashboard/dashboard-shell";

const ADMIN_NAV: readonly DashboardNavItem[] = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/verification", label: "Antrean Verifikasi" },
  { href: "/admin/moderation", label: "Moderasi Listing" },
  { href: "/admin/transactions", label: "Riwayat Transaksi" },
];

export function AdminSidebar({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell nav={ADMIN_NAV} rootHref="/admin" title="Admin">
      {children}
    </DashboardShell>
  );
}
