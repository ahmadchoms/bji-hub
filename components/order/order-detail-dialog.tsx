"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Order } from "@/types";
import { formatRupiah } from "@/components/shared/price-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { OrderStatusStepper } from "@/components/order/order-status-stepper";
import { OrderPrintModal } from "@/components/order/order-print-modal";
import { ShipmentTrackingModal } from "@/components/order/shipment-tracking-modal";
import { OrderReviewModal } from "@/components/order/order-review-modal";
import { ConfirmOrderButton } from "@/components/order/confirm-order-button";
import { OrderDisputeModal } from "@/components/order/order-dispute-modal";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import {
  Package,
  Truck,
  Store,
  Clock,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  CreditCard,
  XCircle,
  RotateCcw,
  AlertCircle,
} from "lucide-react";

interface OrderDetailDialogProps {
  order: Order;
  productImage?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onReorder?: (order: Order) => void;
  onResumePayment?: (order: Order) => void;
  onCancelOrder?: (orderId: string) => void;
  onCancelPaidOrder?: (orderId: string, reason: string) => void;
  isPaying?: boolean;
  isCanceling?: boolean;
}

export function OrderDetailDialog({
  order,
  productImage,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onReorder,
  onResumePayment,
  onCancelOrder,
  onCancelPaidOrder,
  isPaying = false,
  isCanceling = false,
}: OrderDetailDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [copiedResi, setCopiedResi] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedResi(true);
    toast.success("Nomor resi berhasil disalin!");
    setTimeout(() => setCopiedResi(false), 2000);
  };

  const getStatusBadge = () => {
    switch (order.status) {
      case "completed":
        return (
          <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-300 font-semibold text-xs">
            Selesai
          </Badge>
        );
      case "shipped":
        return (
          <Badge variant="outline" className="text-purple-700 bg-purple-50 border-purple-300 font-semibold text-xs">
            Dikirim
          </Badge>
        );
      case "paid":
        return (
          <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-300 font-semibold text-xs">
            Diproses
          </Badge>
        );
      case "disputed":
        return (
          <Badge variant="outline" className="text-rose-700 bg-rose-50 border-rose-300 font-semibold text-xs">
            Komplain
          </Badge>
        );
      case "canceled":
        return (
          <Badge variant="outline" className="text-neutral-600 bg-neutral-100 border-neutral-300 font-semibold text-xs">
            Dibatalkan
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-amber-800 bg-amber-50 border-amber-300 font-semibold text-xs">
            Menunggu Pembayaran
          </Badge>
        );
    }
  };

  const formattedDate = order.createdAt
    ? format(new Date(order.createdAt), "d MMMM yyyy, HH:mm", {
        locale: idLocale,
      })
    : "-";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger as React.ReactElement} />}

      <DialogContent className="max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4">
        <DialogHeader className="border-b border-neutral-200 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-neutral-900">
                Detail Transaksi
              </DialogTitle>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">
                No. Pesanan: <strong className="text-neutral-800">{order.orderNumber}</strong>
              </p>
            </div>
            <div>{getStatusBadge()}</div>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Waktu Transaksi: {formattedDate} WIB
          </p>
        </DialogHeader>

        {/* Tracking Stepper */}
        <div className="py-1 px-1 sm:px-4 bg-neutral-50/70 rounded-md border border-neutral-200/60">
          <OrderStatusStepper status={order.status} />
        </div>

        {/* Pending Payment Alert */}
        {order.status === "pending_payment" && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-amber-950">
              <Clock className="w-4 h-4 text-amber-700 shrink-0" />
              Menunggu Penyelesaian Pembayaran (Batas 60 Menit)
            </div>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              Selesaikan pembayaran dalam 60 menit sebelum pesanan otomatis dibatalkan agar stok kopi yang dipesan tidak dilepaskan kembali.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-200/60">
              {onCancelOrder && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isCanceling}
                  onClick={() => onCancelOrder(order.id)}
                  className="text-xs h-7 px-2.5 text-rose-700 border-rose-300 hover:bg-rose-50"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  {isCanceling ? "Membatalkan..." : "Batalkan Pesanan"}
                </Button>
              )}
              {onResumePayment && (
                <Button
                  type="button"
                  size="sm"
                  disabled={isPaying}
                  onClick={() => onResumePayment(order)}
                  className="text-xs h-7 px-3 bg-neutral-900 hover:bg-neutral-800 text-white font-medium"
                >
                  <CreditCard className="w-3.5 h-3.5 mr-1" />
                  {isPaying ? "Memuat..." : "Bayar Sekarang"}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Paid Alert */}
        {order.status === "paid" && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Pembayaran Terverifikasi
              </span>
              <span className="text-[11px] font-medium text-emerald-800">
                Menunggu Pengiriman
              </span>
            </div>
            <p className="text-emerald-800 text-[11px] leading-relaxed">
              Pesanan Anda sedang dipersiapkan oleh pihak roastery. Anda dapat mengajukan pembatalan dan refund sebelum pesanan diserahkan ke kurir ekspedisi.
            </p>
            {onCancelPaidOrder && (
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-emerald-200/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isCanceling}
                  onClick={() => {
                    const reason = window.prompt("Alasan pembatalan dan refund:", "Perubahan rencana pemesanan");
                    if (reason && reason.trim()) {
                      onCancelPaidOrder(order.id, reason.trim());
                    }
                  }}
                  className="text-xs h-7 px-2.5 text-rose-700 border-rose-300 hover:bg-rose-50"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  {isCanceling ? "Membatalkan..." : "Batalkan & Ajukan Refund"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Shipped Alert */}
        {order.status === "shipped" && (
          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-md text-xs text-purple-900 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-purple-700 shrink-0" /> Paket Sedang Dalam Pengiriman
              </span>
              <span className="text-[11px] font-medium text-purple-800">
                Garansi Otomatis 2x24 Jam
              </span>
            </div>
            <p className="text-[11px] text-purple-800">
              Paket telah diserahkan ke kurir ekspedisi. Harap periksa isi paket setelah tiba dan segera konfirmasi penerimaan di bawah.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-purple-200/60">
              <OrderDisputeModal orderId={order.id} orderNumber={order.orderNumber} />
              <ConfirmOrderButton orderId={order.id} orderNumber={order.orderNumber} />
            </div>
          </div>
        )}

        {/* Disputed Alert */}
        {order.status === "disputed" && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-rose-950">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              Pesanan Sedang Dalam Komplain / Mediasi
            </div>
            <p className="text-rose-800">
              <span className="font-medium">Alasan:</span> &ldquo;{order.disputeReason || "Kendala produk/pengiriman"}&rdquo;
            </p>
            {order.disputeEvidenceUrl && (
              <a
                href={order.disputeEvidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-rose-700 underline font-medium hover:text-rose-900"
              >
                <ExternalLink className="w-3 h-3" /> Foto Bukti Kendala Terlampir
              </a>
            )}
          </div>
        )}

        {/* Info Pengiriman */}
        <div className="border border-neutral-200 rounded-md p-3.5 space-y-2 text-xs bg-white">
          <p className="font-bold text-neutral-900 flex items-center gap-1.5 text-xs">
            <Truck className="w-3.5 h-3.5 text-neutral-700" /> Informasi Pengiriman
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-neutral-100 text-neutral-700">
            <div>
              <span className="text-neutral-500 text-[11px] block">Kurir Ekspedisi:</span>
              <p className="font-semibold text-neutral-900 mt-0.5">
                {order.shippingCourier || "JNE Reguler"}
              </p>
              {order.trackingNumber && (
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded text-[11px] border border-neutral-200">
                    {order.trackingNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(order.trackingNumber!)}
                    className="text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-0.5 cursor-pointer text-[11px]"
                    title="Salin nomor resi"
                  >
                    {copiedResi ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedResi ? "Tersalin" : "Salin"}</span>
                  </button>
                  <ShipmentTrackingModal
                    trackingNumber={order.trackingNumber}
                    courierCode={order.shippingCourier || "jne"}
                    orderNumber={order.orderNumber}
                  />
                </div>
              )}
            </div>

            <div>
              <span className="text-neutral-500 text-[11px] block">Alamat Penerima:</span>
              <p className="font-semibold text-neutral-900 mt-0.5">
                {order.buyerName} <span className="font-normal text-neutral-500 font-mono">({order.buyerPhone})</span>
              </p>
              <p className="text-neutral-600 text-[11px] mt-0.5 leading-relaxed">
                {order.buyerAddress}, {order.buyerCity}
              </p>
            </div>
          </div>
        </div>

        {/* Detail Produk */}
        <div className="border border-neutral-200 rounded-md p-3.5 space-y-3 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
              <Store className="w-3.5 h-3.5 text-primary-700" />
              <span>{order.sellerName || "Roastery Biji Hub"}</span>
            </div>
            {order.buyerPhone && (
              <a
                href={`https://wa.me/6281234567890?text=${encodeURIComponent(
                  `Halo ${order.sellerName || "Roastery"}, saya pembeli untuk pesanan #${order.orderNumber} (${order.listingTitle || "Kopi"}). Ingin menanyakan pesanan saya.`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-medium bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition-colors"
                title="Hubungi penjual via WhatsApp"
              >
                <MessageCircle className="w-3 h-3 text-emerald-600" />
                Chat Penjual
              </a>
            )}
          </div>

          <div className="flex items-start gap-3">
            {productImage ? (
              <div className="relative w-14 h-14 rounded-md overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
                <Image
                  src={productImage}
                  alt={order.listingTitle || "Produk Kopi"}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-md bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 text-neutral-400">
                <Package className="w-6 h-6" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              {order.listingSlug ? (
                <Link
                  href={`/product/${order.listingSlug}`}
                  className="font-bold text-neutral-900 text-xs sm:text-sm hover:text-primary-700 hover:underline line-clamp-1 transition-colors"
                >
                  {order.listingTitle || `Produk #${order.listingId}`}
                </Link>
              ) : (
                <p className="font-bold text-neutral-900 text-xs sm:text-sm line-clamp-1">
                  {order.listingTitle || `Produk #${order.listingId}`}
                </p>
              )}
              <p className="text-xs text-neutral-500 mt-0.5">
                {order.quantity} pcs/kg × {formatRupiah(order.itemPrice)}
              </p>
              {order.notes && (
                <p className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80 mt-1 inline-block">
                  Catatan: {order.notes}
                </p>
              )}
            </div>

            <div className="text-right shrink-0">
              <span className="font-mono font-bold text-xs sm:text-sm text-neutral-900">
                {formatRupiah(order.subtotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Rincian Pembayaran */}
        <div className="border border-neutral-200 rounded-md p-3.5 space-y-2 text-xs bg-white">
          <p className="font-bold text-neutral-900 text-xs">Rincian Pembayaran</p>
          <div className="space-y-1.5 pt-1 border-t border-neutral-100 text-neutral-600">
            <div className="flex items-center justify-between">
              <span>Total Harga ({order.quantity} barang)</span>
              <span className="font-mono text-neutral-800">{formatRupiah(order.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total Ongkos Kirim ({order.shippingCourier || "Kurir"})</span>
              <span className="font-mono text-neutral-800">{formatRupiah(order.shippingCost)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Biaya Layanan Platform</span>
              <span className="font-mono text-neutral-800">{formatRupiah(order.serviceFee)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-neutral-200 font-bold text-neutral-900 text-sm">
              <span>Total Belanja</span>
              <span className="font-mono text-primary-900 text-base">{formatRupiah(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-200">
          <div className="flex items-center gap-2">
            <OrderPrintModal order={order} defaultMode="invoice" />
          </div>

          <div className="flex items-center gap-2">
            {order.status === "completed" && (
              <>
                <OrderReviewModal
                  orderId={order.id}
                  listingId={order.listingId}
                  listingTitle={order.listingTitle || "Biji Kopi"}
                />
                {onReorder && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      onReorder(order);
                      setOpen(false);
                    }}
                    className="bg-[#2E150C] hover:bg-[#3D1D10] text-white text-xs font-semibold h-8 px-3.5 gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Beli Lagi
                  </Button>
                )}
              </>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-xs h-8 px-3 text-neutral-600"
            >
              Tutup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
