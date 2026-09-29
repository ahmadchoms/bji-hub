import { AdminSidebar } from "@/components/dashboard/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-alt">
      <AdminSidebar>
        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">{children}</main>
      </AdminSidebar>
    </div>
  );
}
