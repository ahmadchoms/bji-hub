"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Order } from "@/types";
import { formatRupiah } from "@/components/shared/price-text";
import { Button } from "@/components/ui/button";
import { buildManualPaymentConfirmationUrl } from "@/lib/notifications";
import { checkOrderPaymentStatusAction } from "@/actions/order.actions";
import { toast } from "sonner";
import {
  QrCode,
  Building2,
  Copy,
  Check,
  MessageCircle,
  ShieldCheck,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface StaticPaymentInstructionsProps {
  order: Order;
  accessToken?: string;
}

const BANK_ACCOUNTS = [
  {
    bankName: "BCA",
    accountNumber: "1234567890",
    accountHolder: "PT BIJI HUB INDONESIA",
  },
  {
    bankName: "Mandiri",
    accountNumber: "9876543210",
    accountHolder: "PT BIJI HUB INDONESIA",
  },
];

export function StaticPaymentInstructions({
  order,
  accessToken,
}: StaticPaymentInstructionsProps) {
  const router = useRouter();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"qris" | "bank">("qris");
  const [isChecking, startCheckingTransition] = useTransition();

  const handleCopy = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      toast.success("Berhasil disalin ke clipboard!");
      setTimeout(() => setCopiedField(null), 2500);
    } catch {
      toast.error("Gagal menyalin teks.");
    }
  };

  const handleCheckStatus = () => {
    startCheckingTransition(async () => {
      const res = await checkOrderPaymentStatusAction(order.id, accessToken);
      if (res.success && res.data?.isPaid) {
        toast.success("Pembayaran telah diverifikasi oleh admin! Memperbarui halaman...");
        router.refresh();
      } else {
        toast.info(
          "Pembayaran masih menunggu konfirmasi admin. Pastikan Anda sudah mengirim bukti via WhatsApp.",
        );
      }
    });
  };

  const waUrl = buildManualPaymentConfirmationUrl({
    orderNumber: order.orderNumber,
    buyerName: order.buyerName,
    totalAmount: order.totalAmount,
  });

  return (
    <div className="bg-white border border-neutral-300 rounded-xl p-5 sm:p-6 shadow-xs space-y-6">
      {/* Header & Total Nominal */}
      <div className="border-b border-neutral-200 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full w-fit mb-1.5 border border-amber-200">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              Menunggu Pembayaran Manual
            </div>
            <h2 className="text-lg font-bold text-neutral-900">
              Instruksi Pembayaran & Konfirmasi
            </h2>
            <p className="text-xs text-neutral-600 mt-0.5">
              Silakan lakukan pembayaran sesuai total tagihan di bawah ini.
            </p>
          </div>

          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 sm:text-right">
            <span className="text-xs text-neutral-600 font-medium block">
              Total Tagihan Pesanan
            </span>
            <div className="flex items-center sm:justify-end gap-2 mt-0.5">
              <span className="text-xl font-bold font-mono text-primary-900">
                {formatRupiah(order.totalAmount)}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCopy(String(order.totalAmount), "amount")}
                className="h-8 px-2.5 text-xs gap-1 border-neutral-300"
                title="Salin nominal transfer"
              >
                {copiedField === "amount" ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700 font-medium">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-neutral-600" />
                    <span>Salin</span>
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-amber-800 mt-1">
              *Harap transfer tepat hingga digit terakhir agar mudah diverifikasi
            </p>
          </div>
        </div>
      </div>

      {/* Payment Method Switcher */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-200">
          <button
            type="button"
            onClick={() => setActiveTab("qris")}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "qris"
                ? "border-primary-700 text-primary-900"
                : "border-transparent text-neutral-600 hover:text-neutral-800"
            }`}
          >
            <QrCode className="w-4 h-4" />
            QRIS Statis (Semua Bank & e-Wallet)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bank")}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "bank"
                ? "border-primary-700 text-primary-900"
                : "border-transparent text-neutral-600 hover:text-neutral-800"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Transfer Bank Manual (BCA / Mandiri)
          </button>
        </div>

        {/* Tab 1: QRIS */}
        {activeTab === "qris" && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
              {/* QR Box SVG Rendering */}
              <div className="bg-white p-3 rounded-lg border border-neutral-300 shadow-xs flex flex-col items-center shrink-0">
                <div className="w-48 h-48 sm:w-52 sm:h-52 bg-white flex flex-col items-center justify-between p-2 border border-neutral-200 rounded">
                  <div className="text-xs font-black text-rose-700 tracking-wider flex items-center gap-1">
                    <span className="px-1 py-0.5 bg-rose-700 text-white rounded font-sans font-black text-xs">
                      QRIS
                    </span>
                    <span>STANDAR PEMBAYARAN</span>
                  </div>

                  {/* Representative High-contrast QR pattern */}
                  <svg
                    className="w-36 h-36 sm:w-40 sm:h-40 text-neutral-900"
                    viewBox="0 0 100 100"
                    fill="currentColor"
                    role="img"
                    aria-label="QRIS Code Biji Hub"
                  >
                    {/* Top-Left Finder */}
                    <rect x="5" y="5" width="30" height="30" rx="3" fill="black" />
                    <rect x="10" y="10" width="20" height="20" rx="2" fill="white" />
                    <rect x="15" y="15" width="10" height="10" rx="1" fill="black" />

                    {/* Top-Right Finder */}
                    <rect x="65" y="5" width="30" height="30" rx="3" fill="black" />
                    <rect x="70" y="10" width="20" height="20" rx="2" fill="white" />
                    <rect x="75" y="15" width="10" height="10" rx="1" fill="black" />

                    {/* Bottom-Left Finder */}
                    <rect x="5" y="65" width="30" height="30" rx="3" fill="black" />
                    <rect x="10" y="70" width="20" height="20" rx="2" fill="white" />
                    <rect x="15" y="75" width="10" height="10" rx="1" fill="black" />

                    {/* Data dots pattern */}
                    <rect x="42" y="8" width="6" height="6" />
                    <rect x="52" y="8" width="6" height="6" />
                    <rect x="42" y="18" width="6" height="6" />
                    <rect x="52" y="24" width="6" height="6" />
                    <rect x="10" y="42" width="6" height="6" />
                    <rect x="20" y="42" width="6" height="6" />
                    <rect x="30" y="42" width="6" height="6" />
                    <rect x="42" y="42" width="16" height="16" rx="2" fill="#2d6a4f" />
                    <rect x="65" y="42" width="6" height="6" />
                    <rect x="75" y="42" width="6" height="6" />
                    <rect x="85" y="42" width="6" height="6" />
                    <rect x="42" y="65" width="6" height="6" />
                    <rect x="52" y="65" width="6" height="6" />
                    <rect x="65" y="65" width="6" height="6" />
                    <rect x="75" y="75" width="6" height="6" />
                    <rect x="85" y="85" width="6" height="6" />
                    <rect x="65" y="85" width="6" height="6" />
                    <rect x="52" y="80" width="6" height="6" />
                  </svg>

                  <div className="text-xs font-bold text-neutral-800 text-center">
                    BIJI HUB INDONESIA
                  </div>
                </div>
                <span className="text-xs text-neutral-600 mt-2 font-mono">
                  NMID: ID1020000000000
                </span>
              </div>

              {/* QR Instructions */}
              <div className="space-y-3 text-xs text-neutral-700">
                <p className="font-semibold text-neutral-900 text-sm">
                  Cara Membayar Menggunakan QRIS:
                </p>
                <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed text-neutral-600">
                  <li>
                    Buka aplikasi <strong>m-Banking</strong> (BCA, Mandiri, BRI, BNI, Jago, dll.) atau <strong>e-Wallet</strong> (GoPay, OVO, Dana, ShopeePay).
                  </li>
                  <li>
                    Pilih menu <strong>Bayar / Scan QRIS</strong> dan arahkan kamera ke barcode di samping.
                  </li>
                  <li>
                    Pastikan nama merchant adalah <strong>BIJI HUB INDONESIA</strong>.
                  </li>
                  <li>
                    Masukkan nominal transfer tepat sebesar{" "}
                    <strong className="text-neutral-900 font-mono">
                      {formatRupiah(order.totalAmount)}
                    </strong>
                    .
                  </li>
                  <li>
                    Selesaikan transaksi dan <strong>simpan bukti transfer (screenshot)</strong>.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Bank Accounts */}
        {activeTab === "bank" && (
          <div className="space-y-3">
            <p className="text-xs text-neutral-600">
              Silakan lakukan transfer antar-bank ke salah satu rekening resmi Biji Hub berikut:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BANK_ACCOUNTS.map((acc) => (
                <div
                  key={acc.bankName}
                  className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-neutral-900">
                      Bank {acc.bankName}
                    </span>
                    <span className="text-xs font-semibold uppercase bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded">
                      Manual Transfer
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-xs text-neutral-600">Nomor Rekening:</span>
                    <div className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded border border-neutral-300">
                      <span className="font-mono font-bold text-sm text-neutral-900">
                        {acc.accountNumber}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(acc.accountNumber, acc.bankName)}
                        className="h-8 px-2 text-xs text-neutral-600 hover:text-neutral-900"
                        title="Salin nomor rekening"
                      >
                        {copiedField === acc.bankName ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-neutral-600" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-neutral-600">
                    Atas Nama: <strong className="text-neutral-900">{acc.accountHolder}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Step via WhatsApp (Zero Storage Upload) */}
      <div className="p-4 sm:p-5 bg-emerald-50 border border-emerald-300 rounded-xl space-y-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-emerald-950">
              Langkah Terakhir: Konfirmasi via WhatsApp
            </h3>
            <p className="text-xs text-emerald-900/90 leading-relaxed">
              Anda <strong>tidak perlu mengunggah file bukti</strong> di halaman web. Cukup klik tombol di bawah untuk membuka chat WhatsApp Admin Biji Hub dan lampirkan screenshot bukti transfer/QRIS Anda langsung.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Konfirmasi Pembayaran ke WhatsApp Admin
          </a>

          <Button
            type="button"
            variant="outline"
            onClick={handleCheckStatus}
            disabled={isChecking}
            className="text-xs font-medium border-emerald-300 text-emerald-900 hover:bg-emerald-100/60 h-10 px-3 shrink-0 gap-1.5"
            title="Cek apakah pembayaran Anda sudah dikonfirmasi oleh admin"
          >
            {isChecking ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
            )}
            Cek Status Pembayaran
          </Button>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-800/80 pt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>
            Admin kami akan segera memverifikasi pesanan Anda. Setelah dikonfirmasi, penjual akan langsung menyiapkan pengiriman biji kopi Anda.
          </span>
        </div>
      </div>
    </div>
  );
}
