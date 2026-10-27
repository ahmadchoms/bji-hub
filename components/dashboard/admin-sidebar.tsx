import {
  DashboardShell,
  type DashboardNavItem,
} from "@/components/dashboard/dashboard-shell";

const ADMIN_NAV: readonly DashboardNavItem[] = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/verification", label: "Antrean Verifikasi" },
  { href: "/admin/moderation", label: "Moderasi Produk" },
  { href: "/admin/transactions", label: "Riwayat Transaksi" },
  { href: "/admin/refunds", label: "Antrean Refund" },
  { href: "/admin/payouts", label: "Pencairan Dana" },
  { href: "/admin/origins", label: "Master Asal Kopi" },
  { href: "/admin/audit-logs", label: "Audit Log" },
];

export function AdminSidebar({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell nav={ADMIN_NAV} rootHref="/admin" title="Admin">
      {children}
    </DashboardShell>
  );
}
