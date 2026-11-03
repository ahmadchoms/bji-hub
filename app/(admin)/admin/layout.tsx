import { headers } from "next/headers";
import { AdminSidebar } from "@/components/dashboard/admin-sidebar";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "/admin";
  await requireRole(["admin"], pathname);

  return (
    <div className="min-h-screen bg-surface-alt">
      <AdminSidebar>
        <main id="main-content" className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">{children}</main>
      </AdminSidebar>
    </div>
  );
}
