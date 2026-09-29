import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-alt">
      <DashboardSidebar>
        <main className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-6xl mx-auto">
          {children}
        </main>
      </DashboardSidebar>
    </div>
  );
}
