import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { requireRole } from "@/lib/auth/session";

export default async function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["seller"], "/dashboard");

  return (
    <div className="min-h-screen bg-surface-alt">
      <DashboardSidebar>
        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">{children}</main>
      </DashboardSidebar>
    </div>
  );
}
