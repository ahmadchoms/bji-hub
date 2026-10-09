import Script from "next/script";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { requireRole } from "@/lib/auth/session";

export default async function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["seller"], "/dashboard");

  const snapScriptUrl =
    process.env.MIDTRANS_IS_PRODUCTION === "true"
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";
  const clientKey = process.env.MIDTRANS_CLIENT_KEY;

  return (
    <div className="min-h-screen bg-surface-alt">
      {clientKey && (
        <Script
          src={snapScriptUrl}
          data-client-key={clientKey}
          strategy="lazyOnload"
        />
      )}
      <DashboardSidebar>
        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">{children}</main>
      </DashboardSidebar>
    </div>
  );
}
