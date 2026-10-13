"use client";

import { useState } from "react";
import type { Order } from "@/types";
import { formatRupiah } from "@/components/shared/price-text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Printer,
  FileText,
  ExternalLink,
  ShieldCheck,
  Building2,
  User,
} from "lucide-react";

interface OrderPrintModalProps {
  order: Order;
  defaultMode?: "invoice" | "shipping_label";
  trigger?: React.ReactNode;
}

// Generate pseudo-code128 barcode bars as pure inline SVG
function BarcodeSvg({ value }: { value: string }) {
  // Deterministic bar widths from string chars
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
        className="w-48 h-10 max-w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {bars.map((bar, idx) => (
          <rect key={idx} x={bar.x} y={0} width={bar.w} height={45} fill="#000000" />
        ))}
      </svg>
      <span className="font-mono text-[11px] tracking-widest text-neutral-800 font-bold mt-0.5">
        {value}
      </span>
    </div>
  );
}

export function OrderPrintModal({
  order,
  defaultMode = "shipping_label",
  trigger,
}: OrderPrintModalProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"invoice" | "shipping_label">(defaultMode);

  const formattedDate = order.createdAt
    ? format(new Date(order.createdAt), "d MMMM yyyy, HH:mm", { locale: idLocale })
    : "-";

  const handlePrint = () => {
    // Open clean print page in new tab and auto-trigger window.print()
    const printUrl = `/order/invoice?orderNumber=${order.orderNumber}&mode=${mode}&autoPrint=true`;
    window.open(printUrl, "_blank", "width=850,height=900");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ? (
            (trigger as React.ReactElement)
          ) : (
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
              {defaultMode === "shipping_label" ? (
                <>
                  <Printer className="w-3.5 h-3.5 text-neutral-600" />
                  Cetak Label
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-neutral-600" />
                  Invoice
                </>
              )}
            </Button>
          )
        }
      />
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="border-b border-neutral-200 pb-3 flex flex-row items-center justify-between gap-3 pr-8">
          <div>
            <DialogTitle className="text-base font-bold text-neutral-900">
              Pratinjau Cetak & Dokumen
            </DialogTitle>
            <p className="text-xs text-neutral-500 mt-0.5">
              Pesanan #{order.orderNumber} &bull; {order.shippingCourier || "Kurir"}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="inline-flex rounded-md bg-neutral-100 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setMode("shipping_label")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                mode === "shipping_label"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Label Pengiriman
            </button>
            <button
              type="button"
              onClick={() => setMode("invoice")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                mode === "invoice"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Invoice Resmi
            </button>
          </div>
        </DialogHeader>

        {/* Document Preview Box */}
        <div className="bg-neutral-100 p-3 sm:p-5 rounded-lg border border-neutral-200 overflow-x-auto">
          {mode === "shipping_label" ? (
            /* ============================================================== */
            /* SHIPPING LABEL (THERMAL / A6) PREVIEW                          */
            /* ============================================================== */
            <div className="bg-white border-2 border-dashed border-neutral-800 p-4 sm:p-5 rounded shadow-sm text-neutral-900 text-xs font-sans max-w-lg mx-auto space-y-3">
              {/* Top Banner: Courier & Non-COD badge */}
              <div className="flex items-center justify-between border-b-2 border-neutral-900 pb-2.5">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">
                    Ekspedisi Pengiriman
                  </span>
                  <span className="text-lg font-black tracking-tight text-neutral-900 uppercase">
                    {order.shippingCourier || "JNE REGULER"}
                  </span>
                </div>
                <div className="text-right">
                  <Badge className="bg-neutral-900 text-white font-bold text-xs uppercase px-2.5 py-1">
                    NON-COD (LUNAS)
                  </Badge>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">
                    Ongkir ditanggung sistem
                  </span>
                </div>
              </div>

              {/* Barcode & Tracking */}
              <div className="py-1 text-center border-b border-neutral-200">
                <BarcodeSvg value={order.trackingNumber || order.orderNumber} />
                <div className="flex items-center justify-center gap-4 text-[11px] text-neutral-600 mt-1 font-mono">
                  <span>No. Resi: <strong>{order.trackingNumber || "- (Belum ada)"}</strong></span>
                  <span>No. Pesanan: <strong>{order.orderNumber}</strong></span>
                </div>
              </div>

              {/* Sender & Receiver Grid */}
              <div className="grid grid-cols-2 gap-3 border-b border-neutral-200 pb-3">
                {/* Penerima */}
                <div className="space-y-1">
                  <span className="font-bold uppercase text-[10px] text-neutral-500 flex items-center gap-1">
                    <User className="w-3 h-3" /> Kepada (Penerima):
                  </span>
                  <p className="font-bold text-neutral-900 text-sm leading-tight">
                    {order.buyerName}
                  </p>
                  <p className="font-mono text-neutral-700 text-xs">{order.buyerPhone}</p>
                  <p className="text-neutral-800 text-[11px] leading-relaxed">
                    {order.buyerAddress}
                  </p>
                  <p className="font-semibold text-neutral-900 text-xs">
                    {order.buyerCity}
                  </p>
                </div>

                {/* Pengirim */}
                <div className="space-y-1 border-l border-neutral-200 pl-3">
                  <span className="font-bold uppercase text-[10px] text-neutral-500 flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Dari (Pengirim):
                  </span>
                  <p className="font-bold text-neutral-900 text-sm leading-tight">
                    {order.sellerName || "Mitra Roastery Biji Hub"}
                  </p>
                  <p className="text-neutral-500 text-[11px]">
                    Biji Hub Marketplace Kopi Indonesia
                  </p>
                  <p className="text-[11px] text-neutral-600">
                    Kota Penjual: Bandung / Origin Terdaftar
                  </p>
                </div>
              </div>

              {/* Product Contents & Note */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold uppercase text-[10px] text-neutral-500">
                    Isi Paket:
                  </span>
                  <span className="font-mono font-bold text-neutral-900 text-xs">
                    Qty: {order.quantity} pcs / kg
                  </span>
                </div>
                <p className="font-medium text-neutral-900 text-xs bg-neutral-50 p-2 rounded border border-neutral-200">
                  {order.listingTitle || `Produk ID #${order.listingId}`}
                </p>

                {order.notes && (
                  <p className="text-[11px] text-neutral-700 italic bg-amber-50/60 p-1.5 rounded border border-amber-200">
                    <span className="font-bold not-italic">Catatan:</span> {order.notes}
                  </p>
                )}
              </div>

              {/* Footer info */}
              <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-[10px] text-neutral-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Biji Hub Verified Shipping Label
                </span>
                <span>{formattedDate}</span>
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* INVOICE (A4) PREVIEW                                           */
            /* ============================================================== */
            <div className="bg-white border border-neutral-300 p-5 sm:p-6 rounded shadow-sm text-neutral-900 text-xs font-sans max-w-xl mx-auto space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-neutral-200 pb-4">
                <div>
                  <h3 className="text-xl font-black font-display tracking-tight text-primary-950">
                    BIJI HUB
                  </h3>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Platform Marketplace Biji Kopi Indonesia
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    https://bji-hub.vercel.app
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold tracking-wide uppercase text-neutral-700 block">
                    INVOICE
                  </span>
                  <span className="font-mono text-xs font-bold text-neutral-900 block">
                    INV-{order.orderNumber}
                  </span>
                  <Badge variant="outline" className="mt-1 text-emerald-700 bg-emerald-50 border-emerald-300 text-[10px]">
                    LUNAS (ESCROW)
                  </Badge>
                </div>
              </div>

              {/* Transaction Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-bold">
                    Diterbitkan Untuk:
                  </span>
                  <p className="font-bold text-neutral-900">{order.buyerName}</p>
                  <p className="text-neutral-600 font-mono text-[11px]">{order.buyerPhone}</p>
                  <p className="text-neutral-600 text-[11px]">{order.buyerAddress}, {order.buyerCity}</p>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-bold">
                    Penjual (Roastery):
                  </span>
                  <p className="font-bold text-neutral-900">
                    {order.sellerName || "Mitra Roastery Biji Hub"}
                  </p>
                  <p className="text-neutral-500 text-[11px] mt-1">
                    Tanggal: <strong className="text-neutral-700">{formattedDate}</strong>
                  </p>
                  <p className="text-neutral-500 text-[11px]">
                    Kurir: <strong className="text-neutral-700">{order.shippingCourier || "-"}</strong>
                  </p>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="border border-neutral-200 rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold text-[11px]">
                    <tr>
                      <th className="p-2.5">Deskripsi Produk</th>
                      <th className="p-2.5 text-center">Jumlah</th>
                      <th className="p-2.5 text-right">Harga Satuan</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-800">
                    <tr>
                      <td className="p-2.5">
                        <span className="font-medium text-neutral-900 block">
                          {order.listingTitle || `Produk #${order.listingId}`}
                        </span>
                        {order.notes && (
                          <span className="text-[10px] text-neutral-500 italic block mt-0.5">
                            Catatan: {order.notes}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-center font-mono">{order.quantity}</td>
                      <td className="p-2.5 text-right font-mono">{formatRupiah(order.itemPrice)}</td>
                      <td className="p-2.5 text-right font-mono font-medium">{formatRupiah(order.subtotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Cost Calculation Breakdown */}
              <div className="space-y-1.5 pt-1 text-xs border-t border-neutral-100">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal Produk</span>
                  <span className="font-mono text-neutral-900">{formatRupiah(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Ongkos Kirim ({order.shippingCourier || "Kurir"})</span>
                  <span className="font-mono text-neutral-900">{formatRupiah(order.shippingCost)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Biaya Layanan Escrow Biji Hub</span>
                  <span className="font-mono text-neutral-900">{formatRupiah(order.serviceFee)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-neutral-900 font-bold text-sm">
                  <span className="text-neutral-900">Total Pembayaran</span>
                  <span className="font-mono text-primary-900 text-base">
                    {formatRupiah(order.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Watermark & Verification Guarantee */}
              <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200 text-[10px] text-emerald-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  Invoice ini sah dan diterbitkan otomatis oleh sistem Biji Hub. Pembayaran telah diverifikasi secara elektronik via Midtrans payment gateway.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-200">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            className="text-xs"
          >
            Tutup
          </Button>

          <div className="flex items-center gap-2">
            <a
              href={`/order/invoice?orderNumber=${order.orderNumber}&mode=${mode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded border border-neutral-300 font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Buka Tab Baru
            </a>
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="text-xs bg-primary-600 hover:bg-primary-700 text-white gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak / Simpan PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
