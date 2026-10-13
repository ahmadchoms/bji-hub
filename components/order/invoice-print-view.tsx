"use client";

import { useEffect, useState } from "react";
import type { Order } from "@/types";
import { formatRupiah } from "@/components/shared/price-text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Printer,
  ShieldCheck,
  Building2,
  User,
  ArrowLeft,
} from "lucide-react";

interface InvoicePrintViewProps {
  order: Order;
  initialMode?: "invoice" | "shipping_label";
  autoPrint?: boolean;
}

function BarcodeSvg({ value }: { value: string }) {
  const widths = [2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 2];
  let x = 10;
  const bars: { x: number; w: number }[] = [];

  for (let i = 0; i < 35; i++) {
    const charCode = value.charCodeAt(i % value.length) || 65;
    const w = widths[(charCode + i) % widths.length];
    if (i % 2 === 0) {
      bars.push({ x, w });
    }
    x += w + 1.5;
  }

  const totalWidth = x + 10;

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${totalWidth} 45`}
        className="w-56 h-12 max-w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {bars.map((bar, idx) => (
          <rect key={idx} x={bar.x} y={0} width={bar.w} height={45} fill="#000000" />
        ))}
      </svg>
      <span className="font-mono text-xs tracking-widest text-neutral-900 font-bold mt-1">
        {value}
      </span>
    </div>
  );
}

export function InvoicePrintView({
  order,
  initialMode = "invoice",
  autoPrint = false,
}: InvoicePrintViewProps) {
  const [mode, setMode] = useState<"invoice" | "shipping_label">(initialMode);

  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const formattedDate = order.createdAt
    ? format(new Date(order.createdAt), "d MMMM yyyy, HH:mm", { locale: idLocale })
    : "-";

  return (
    <div className="min-h-screen bg-neutral-100 print:bg-white text-neutral-900 font-sans pb-12 print:pb-0">
      {/* Floating Action Top Bar - Hidden on Print */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-neutral-300 py-3 px-4 shadow-xs print:hidden">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  window.close();
                }
              }}
              className="text-xs text-neutral-600 gap-1 h-8"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali
            </Button>
            <div className="border-l border-neutral-300 h-5" />
            <span className="font-bold text-sm text-neutral-900">
              Dokumen Cetak Pesanan #{order.orderNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Format Selector */}
            <div className="inline-flex rounded-md bg-neutral-100 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setMode("shipping_label")}
                className={`px-3 py-1.5 rounded font-medium transition-colors ${
                  mode === "shipping_label"
                    ? "bg-white text-neutral-900 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                Label Pengiriman (A6)
              </button>
              <button
                type="button"
                onClick={() => setMode("invoice")}
                className={`px-3 py-1.5 rounded font-medium transition-colors ${
                  mode === "invoice"
                    ? "bg-white text-neutral-900 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                Invoice Transaksi (A4)
              </button>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => window.print()}
              className="bg-primary-600 hover:bg-primary-700 text-white text-xs gap-1.5 h-8 font-medium"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak / Simpan PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Document Paper Container */}
      <div className="py-6 px-4 print:p-0">
        {mode === "shipping_label" ? (
          /* ============================================================== */
          /* SHIPPING LABEL (THERMAL / A6) PRINTABLE SHEET                  */
          /* ============================================================== */
          <div className="bg-white border-2 border-neutral-900 print:border-2 p-6 rounded-lg shadow-sm print:shadow-none max-w-xl mx-auto space-y-4 print:max-w-none print:w-full print:rounded-none">
            {/* Header Courier */}
            <div className="flex items-center justify-between border-b-2 border-neutral-900 pb-3">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-neutral-500 block">
                  Ekspedisi Logistik
                </span>
                <span className="text-2xl font-black tracking-tight text-neutral-900 uppercase">
                  {order.shippingCourier || "JNE REGULER"}
                </span>
              </div>
              <div className="text-right">
                <Badge className="bg-neutral-900 text-white font-bold text-sm uppercase px-3 py-1.5 rounded">
                  NON-COD (LUNAS)
                </Badge>
                <span className="text-[11px] text-neutral-500 block mt-1">
                  Ongkir telah ditanggung Biji Hub
                </span>
              </div>
            </div>

            {/* Barcode & Numbers */}
            <div className="py-3 text-center border-b-2 border-neutral-200">
              <BarcodeSvg value={order.trackingNumber || order.orderNumber} />
              <div className="flex items-center justify-center gap-6 text-xs text-neutral-700 mt-2 font-mono">
                <span>
                  No. Resi: <strong>{order.trackingNumber || "- (Menunggu Resi)"}</strong>
                </span>
                <span>
                  No. Pesanan: <strong>{order.orderNumber}</strong>
                </span>
              </div>
            </div>

            {/* Recipient & Sender */}
            <div className="grid grid-cols-2 gap-4 border-b-2 border-neutral-200 pb-4 text-xs">
              <div className="space-y-1">
                <span className="font-bold uppercase text-[11px] text-neutral-500 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Kepada (Penerima):
                </span>
                <p className="font-bold text-neutral-900 text-base leading-tight">
                  {order.buyerName}
                </p>
                <p className="font-mono text-neutral-800 text-sm font-semibold">{order.buyerPhone}</p>
                <p className="text-neutral-700 text-xs leading-relaxed pt-0.5">
                  {order.buyerAddress}
                </p>
                <p className="font-bold text-neutral-900 text-sm">
                  {order.buyerCity}
                </p>
              </div>

              <div className="space-y-1 border-l-2 border-neutral-200 pl-4">
                <span className="font-bold uppercase text-[11px] text-neutral-500 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> Dari (Pengirim):
                </span>
                <p className="font-bold text-neutral-900 text-base leading-tight">
                  {order.sellerName || "Mitra Roastery Biji Hub"}
                </p>
                <p className="text-neutral-600 text-xs mt-0.5">
                  Biji Hub Marketplace Kopi Indonesia
                </p>
                <p className="text-xs text-neutral-600">
                  Kota Pengirim: Bandung / Origin Terdaftar
                </p>
              </div>
            </div>

            {/* Product description & note */}
            <div className="space-y-2 pt-1 text-xs">
              <div className="flex justify-between items-baseline">
                <span className="font-bold uppercase text-[11px] text-neutral-500">
                  Rincian Isi Paket Kopi:
                </span>
                <span className="font-mono font-bold text-neutral-900 text-sm">
                  Kuantitas: {order.quantity} pcs / kg
                </span>
              </div>
              <p className="font-semibold text-neutral-900 text-sm bg-neutral-50 p-2.5 rounded border border-neutral-200">
                {order.listingTitle || `Produk ID #${order.listingId}`}
              </p>

              {order.notes && (
                <p className="text-xs text-neutral-800 italic bg-amber-50 p-2 rounded border border-amber-200">
                  <span className="font-bold not-italic">Catatan Pengiriman:</span> {order.notes}
                </p>
              )}
            </div>

            {/* Thermal Footer */}
            <div className="pt-3 border-t-2 border-neutral-900 flex items-center justify-between text-[11px] text-neutral-500">
              <span className="flex items-center gap-1 font-medium text-neutral-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Biji Hub Escrow Verified Shipping Label
              </span>
              <span className="font-mono">{formattedDate}</span>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* INVOICE (A4) PRINTABLE SHEET                                   */
          /* ============================================================== */
          <div className="bg-white border border-neutral-300 print:border-none p-8 sm:p-12 rounded-lg shadow-sm print:shadow-none max-w-3xl mx-auto space-y-6 print:max-w-none print:w-full print:p-0">
            {/* Header */}
            <div className="flex items-start justify-between border-b-2 border-neutral-900 pb-6">
              <div>
                <h1 className="text-3xl font-black font-display tracking-tight text-primary-950">
                  BIJI HUB
                </h1>
                <p className="text-xs text-neutral-600 mt-1 font-medium">
                  Marketplace Biji Kopi Sangrai & Green Beans Spesialti Indonesia
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  https://bji-hub.vercel.app &bull; Layanan Rekening Bersama Escrow
                </p>
              </div>
              <div className="text-right">
                <span className="text-lg font-black tracking-wider uppercase text-neutral-900 block">
                  INVOICE PEMBELIAN
                </span>
                <span className="font-mono text-sm font-bold text-neutral-800 block mt-0.5">
                  INV-{order.orderNumber}
                </span>
                <Badge variant="outline" className="mt-2 text-emerald-800 bg-emerald-50 border-emerald-300 font-bold text-xs">
                  LUNAS (ESCROW)
                </Badge>
              </div>
            </div>

            {/* Metadata Information */}
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div className="space-y-1">
                <span className="text-neutral-500 block text-[11px] uppercase font-bold tracking-wider">
                  Diterbitkan Untuk:
                </span>
                <p className="font-bold text-neutral-900 text-sm">{order.buyerName}</p>
                <p className="text-neutral-600 font-mono text-xs">{order.buyerPhone}</p>
                <p className="text-neutral-500 text-xs">{order.buyerEmail}</p>
                <p className="text-neutral-700 text-xs pt-1 leading-relaxed">
                  {order.buyerAddress}, {order.buyerCity}
                </p>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-neutral-500 block text-[11px] uppercase font-bold tracking-wider">
                  Penjual (Mitra Roastery):
                </span>
                <p className="font-bold text-neutral-900 text-sm">
                  {order.sellerName || "Mitra Roastery Biji Hub"}
                </p>
                <p className="text-neutral-600 text-xs pt-1">
                  Tanggal Pesanan: <strong className="text-neutral-900">{formattedDate}</strong>
                </p>
                <p className="text-neutral-600 text-xs">
                  Metode Pengiriman: <strong className="text-neutral-900">{order.shippingCourier || "JNE"}</strong>
                </p>
                {order.trackingNumber && (
                  <p className="text-neutral-600 text-xs">
                    Nomor Resi: <strong className="font-mono text-neutral-900">{order.trackingNumber}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Table of items */}
            <div className="border border-neutral-300 rounded overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 border-b border-neutral-300 text-neutral-700 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="p-3">Deskripsi Produk Kopi</th>
                    <th className="p-3 text-center">Jumlah</th>
                    <th className="p-3 text-right">Harga Satuan</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-neutral-800">
                  <tr>
                    <td className="p-3">
                      <span className="font-bold text-neutral-900 text-sm block">
                        {order.listingTitle || `Produk ID #${order.listingId}`}
                      </span>
                      {order.notes && (
                        <span className="text-[11px] text-neutral-600 italic block mt-1">
                          Catatan: {order.notes}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center font-mono text-sm font-semibold">{order.quantity} pcs/kg</td>
                    <td className="p-3 text-right font-mono text-sm">{formatRupiah(order.itemPrice)}</td>
                    <td className="p-3 text-right font-mono font-bold text-sm text-neutral-900">
                      {formatRupiah(order.subtotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Financial summary */}
            <div className="flex justify-end">
              <div className="w-full sm:w-72 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal Produk</span>
                  <span className="font-mono text-neutral-900 font-medium">{formatRupiah(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Ongkos Kirim ({order.shippingCourier || "Kurir"})</span>
                  <span className="font-mono text-neutral-900 font-medium">{formatRupiah(order.shippingCost)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Biaya Layanan Platform</span>
                  <span className="font-mono text-neutral-900 font-medium">{formatRupiah(order.serviceFee)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t-2 border-neutral-900 font-bold text-sm">
                  <span className="text-neutral-900">Total Pembayaran</span>
                  <span className="font-mono text-primary-950 text-lg">
                    {formatRupiah(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Disclaimer */}
            <div className="pt-6 border-t border-neutral-200 space-y-2 text-[11px] text-neutral-500">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Sertifikasi Pembayaran Rekening Bersama (Escrow Guarantee)
              </div>
              <p className="leading-relaxed">
                Bukti transaksi ini diterbitkan secara sah oleh sistem Biji Hub. Pembayaran telah diverifikasi secara elektronik melalui Midtrans. Dana pembayaran ditampung aman dalam rekening escrow dan baru diteruskan ke roastery penjual setelah produk dikonfirmasi tiba dengan baik.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
