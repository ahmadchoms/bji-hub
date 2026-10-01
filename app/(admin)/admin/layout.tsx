import { AdminSidebar } from "@/components/dashboard/admin-sidebar";
import { requireRole } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["admin"], "/admin");

  return (
    <div className="min-h-screen bg-surface-alt">
      <AdminSidebar>
        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">{children}</main>
      </AdminSidebar>
    </div>
  );
}
