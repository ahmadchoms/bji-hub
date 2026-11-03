import { AdminSidebar } from "@/components/dashboard/admin-sidebar";
import { getSession } from "@/lib/auth/session";
import { isAdminAllowed } from "@/lib/auth/admin-guard";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session.isSuspended) {
    redirect("/login?error=suspended");
  }
  const allowed = await isAdminAllowed(session);
  if (!allowed) {
    redirect("/login?next=%2Fadmin");
  }

  return (
    <div className="min-h-screen bg-surface-alt">
      <AdminSidebar>
        <main id="main-content" className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">{children}</main>
      </AdminSidebar>
    </div>
  );
}
