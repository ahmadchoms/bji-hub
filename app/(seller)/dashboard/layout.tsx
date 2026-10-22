import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { requireSeller } from "@/lib/auth/session";
import { getSellerBankDetails } from "@/lib/data/payouts";

export default async function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sellerId } = await requireSeller();
  const bankDetails = await getSellerBankDetails(sellerId);
  const isBankMissing = !bankDetails || !bankDetails.bankAccountNumber;

  return (
    <div className="min-h-screen bg-surface-alt">
      <DashboardSidebar>
        <main id="main-content" className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
          {isBankMissing && (
            <div className="bg-amber-50 border border-amber-300 rounded-md p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold text-amber-950">Rekening Pencairan Belum Terdaftar:</span>{" "}
                  Lengkapi nomor rekening bank toko Anda agar saldo penjualan dapat segera dicairkan saat pesanan selesai.
                </div>
              </div>
              <Link
                href="/dashboard/orders"
                className="inline-flex items-center gap-1 font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded text-[11px] shrink-0 transition-colors"
              >
                Atur Rekening Bank <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
          {children}
        </main>
      </DashboardSidebar>
    </div>
  );
}
