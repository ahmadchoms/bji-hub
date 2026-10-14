import type { Metadata } from "next";
import Link from "next/link";
import { getOrderById } from "@/lib/data/orders";
import { PageContainer } from "@/components/layout/page-container";
import { formatRupiah } from "@/components/shared/price-text";
import { buttonVariants } from "@/components/ui/button";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  Truck,
  Package,
  MapPin,
  ArrowRight,
  HelpCircle,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";
import { ConfirmOrderButton } from "@/components/order/confirm-order-button";
import { OrderDisputeModal } from "@/components/order/order-dispute-modal";
import { OrderReviewModal } from "@/components/order/order-review-modal";
import { ShipmentTrackingModal } from "@/components/order/shipment-tracking-modal";
import { OrderPrintModal } from "@/components/order/order-print-modal";
import { OrderStatusStepper } from "@/components/order/order-status-stepper";
import { buildOrderPaidNotificationUrl } from "@/lib/notifications";

export const metadata: Metadata = {
  title: "Status Pesanan - Biji Hub",
  description: "Rincian dan status pembayaran pesanan biji kopi Anda.",
};

interface OrderSuccessPageProps {
  searchParams: Promise<{
    orderId?: string;
    order_id?: string;
    orderNumber?: string;
    order_number?: string;
    id?: string;
  }>;
}

export default async function OrderSuccessPage({
  searchParams,
}: OrderSuccessPageProps) {
  const { orderId, order_id, orderNumber, order_number, id } =
    await searchParams;
  const lookupId = orderNumber || order_number || orderId || order_id || id;

  const order = lookupId ? await getOrderById(lookupId) : null;

  if (!order) {
    return (
      <div className="py-16 text-center">
        <PageContainer className="max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-500">
            <Package className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900">
            Pesanan Tidak Ditemukan
          </h1>
          <p className="text-sm text-neutral-600">
            Nomor pesanan yang Anda tuju tidak ditemukan atau belum tercatat di sistem kami.
          </p>
          <Link href="/" className={buttonVariants({ className: "w-full" })}>
            Kembali ke Beranda
          </Link>
        </PageContainer>
      </div>
    );
  }

  const isPaid = order.status === "paid" || order.status === "shipped" || order.status === "completed";

  return (
    <div className="py-8 md:py-12 bg-neutral-50/50 min-h-[80vh]">
      <PageContainer className="max-w-3xl mx-auto space-y-6">
        {/* Header Status Card */}
        <div className="bg-white border border-neutral-300 rounded-lg p-6 md:p-8 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            {order.status === "completed" ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            ) : order.status === "disputed" ? (
              <AlertTriangle className="w-8 h-8 text-rose-600" />
            ) : order.status === "shipped" ? (
              <Truck className="w-8 h-8 text-purple-600" />
            ) : isPaid ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : (
              <Clock className="w-8 h-8 text-amber-600" />
            )}
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold font-display text-neutral-900">
              {order.status === "completed"
                ? "Pesanan Selesai!"
                : order.status === "disputed"
                  ? "Pesanan Dalam Peninjauan Komplain"
                  : order.status === "shipped"
                    ? "Pesanan Sedang Dikirim!"
                    : isPaid
                      ? "Pembayaran Dikonfirmasi!"
                      : "Pesanan Berhasil Dibuat"}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <p className="text-sm text-neutral-600">
                Nomor Pesanan: <span className="font-mono font-bold text-neutral-900">{order.orderNumber}</span>
              </p>
              <OrderPrintModal order={order} defaultMode="invoice" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            {order.status === "completed"
              ? "Transaksi Sukses (Dana Telah Diteruskan ke Penjual)"
              : order.status === "disputed"
                ? "Dana Escrow Ditahan Sementara (Sedang Dimediasi)"
                : "Garansi Escrow Biji Hub Aktif (Dana Aman Terlindungi)"}
          </div>

          <div className="pt-3 pb-1 px-1 sm:px-6">
            <OrderStatusStepper status={order.status} />
          </div>

          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            {order.status === "completed"
              ? "Terima kasih! Pesanan telah Anda terima dengan baik dan dana penjualan telah diteruskan ke pihak roastery/petani."
              : order.status === "disputed"
                ? `Komplain Anda telah dicatat: "${order.disputeReason || "Kendala pengiriman/produk"}". Tim Biji Hub sedang meninjau dan menghubungi kedua pihak.`
                : order.status === "shipped"
                  ? "Paket Anda sedang dalam perjalanan oleh kurir. Segera periksa paket setelah tiba dan klik konfirmasi di bawah."
                  : isPaid
                    ? "Dana Anda telah aman tertampung di rekening escrow resmi Biji Hub. Penjual telah diberitahu untuk segera memproses & mengirimkan pesanan."
                    : "Menunggu penyelesaian pembayaran. Jika sudah membayar melalui Snap Midtrans, status pesanan akan terbarui secara otomatis."}
          </p>

          {/* Review Action when completed */}
          {order.status === "completed" && (
            <div className="pt-2">
              <OrderReviewModal
                orderId={order.id}
                listingId={order.listingId}
                listingTitle={order.listingTitle || "Biji Kopi"}
              />
            </div>
          )}
        </div>

        {/* Konfirmasi Penerimaan Barang CTA & Escrow Auto-Release Banner (when shipped) */}
        {order.status === "shipped" && (() => {
          const shippedTimestamp = new Date(order.updatedAt || order.createdAt).getTime();
          const autoReleaseDate = new Date(shippedTimestamp + 48 * 60 * 60 * 1000);
          const isAutoReleasePassed = Date.now() > autoReleaseDate.getTime();

          return (
            <div className="p-4 sm:p-5 bg-emerald-50 border border-emerald-300 rounded-lg space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Sudah Menerima Kopi dengan Selamat?
                  </p>
                  <p className="text-xs text-emerald-800">
                    Klik konfirmasi jika produk sudah sesuai. Jika ada kerusakan atau salah barang, ajukan komplain untuk menahan dana.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <OrderDisputeModal orderId={order.id} orderNumber={order.orderNumber} />
                  <ConfirmOrderButton orderId={order.id} orderNumber={order.orderNumber} />
                </div>
              </div>

              <div className="p-2.5 bg-white/80 rounded border border-emerald-200/80 text-[11px] text-emerald-900 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>
                  <strong>Garansi Pelepasan Dana Otomatis:</strong>{" "}
                  {isAutoReleasePassed
                    ? "Batas waktu 2x24 jam telah tercapai. Dana akan dicairkan ke penjual jika tidak ada komplain yang diajukan."
                    : `Batas konfirmasi hingga ${format(autoReleaseDate, "d MMMM yyyy, HH:mm", { locale: idLocale })} sebelum dana escrow diteruskan otomatis ke penjual.`}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Order Details & Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Detail Produk & Kurir */}
          <div className="bg-white border border-neutral-300 rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-200 pb-2 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary-600" /> Detail Produk
            </h2>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-neutral-500">Produk</p>
                <p className="text-sm font-semibold text-neutral-900">
                  {order.listingTitle || `Produk ID #${order.listingId}`}
                </p>
                {order.sellerName && (
                  <p className="text-xs text-neutral-600 mt-0.5">Penjual: {order.sellerName}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-neutral-500">Jumlah:</span>{" "}
                  <span className="font-medium text-neutral-900">{order.quantity} pcs/kg</span>
                </div>
                <div>
                  <span className="text-neutral-500">Harga Satuan:</span>{" "}
                  <span className="font-medium text-neutral-900">{formatRupiah(order.itemPrice)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100">
                <p className="text-xs text-neutral-500">Kurir Pengiriman</p>
                <div className="flex items-center gap-2 mt-1">
                  <Truck className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm font-medium text-neutral-900">{order.shippingCourier}</span>
                </div>
                {order.trackingNumber ? (
                  <div className="mt-2 p-2.5 bg-neutral-50 rounded border border-neutral-200 text-xs flex items-center justify-between gap-2">
                    <div>
                      <span className="text-neutral-500">Nomor Resi:</span>{" "}
                      <span className="font-mono font-bold text-primary-700">{order.trackingNumber}</span>
                    </div>
                    <ShipmentTrackingModal
                      trackingNumber={order.trackingNumber}
                      courierCode={order.shippingCourier || "jne"}
                      orderNumber={order.orderNumber}
                    />
                  </div>
                ) : (
                  <p className="text-[11px] text-neutral-400 mt-1 italic">
                    Nomor resi akan muncul setelah penjual mengirimkan paket.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Rincian Finansial & Penerima */}
          <div className="bg-white border border-neutral-300 rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-200 pb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-600" /> Alamat & Total
            </h2>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-neutral-500">Penerima</p>
                <p className="text-sm font-semibold text-neutral-900">{order.buyerName}</p>
                <p className="text-xs text-neutral-600">{order.buyerPhone}</p>
                <p className="text-xs text-neutral-600 mt-1">{order.buyerAddress}, {order.buyerCity}</p>
              </div>

              <div className="pt-2 border-t border-neutral-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Subtotal Produk</span>
                  <span className="font-mono text-neutral-900">{formatRupiah(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Ongkos Kirim</span>
                  <span className="font-mono text-neutral-900">{formatRupiah(order.shippingCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Biaya Layanan Platform</span>
                  <span className="font-mono text-neutral-900">{formatRupiah(order.serviceFee)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-neutral-200 font-semibold text-sm">
                  <span className="text-neutral-900">Total Pembayaran</span>
                  <span className="font-mono text-primary-700">{formatRupiah(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cara Kerja Rekening Bersama Escrow */}
        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-900 font-medium text-sm">
            <HelpCircle className="w-4 h-4 text-emerald-700" />
            Bagaimana Garansi Pembayaran Biji Hub Menjaga Keamanan Anda?
          </div>
          <ol className="text-xs text-emerald-800 space-y-1.5 list-decimal pl-4">
            <li>
              <strong>Dana Tersimpan di Escrow Resmi:</strong> Penjual tidak akan menerima uang Anda sampai pesanan sampai di tangan Anda dengan selamat.
            </li>
            <li>
              <strong>Jaminan Mutu & Keaslian:</strong> Jika produk kopi tidak sesuai atau rusak dalam pengiriman, Anda berhak mengajukan penahanan pencairan dana.
            </li>
            <li>
              <strong>Pencairan Otomatis:</strong> Setelah barang diterima dan dikonfirmasi atau dalam waktu 2x24 jam setelah status resi menunjukkan paket terkirim, dana baru akan dicairkan ke penjual.
            </li>
          </ol>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Link
            href="/"
            className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}
          >
            Lanjut Belanja di Beranda
          </Link>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            {isPaid && (
              <a
                href={buildOrderPaidNotificationUrl({
                  sellerPhone: "081220001234",
                  sellerName: order.sellerName,
                  buyerName: order.buyerName,
                  orderNumber: order.orderNumber,
                  listingTitle: order.listingTitle || "Biji Kopi",
                  quantity: order.quantity,
                  totalAmount: order.totalAmount,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({
                  className: "w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs",
                })}
              >
                <MessageCircle className="w-3.5 h-3.5" /> Konfirmasi ke WA Penjual
              </a>
            )}

            <Link
              href="/profile"
              className={buttonVariants({
                className: "w-full sm:w-auto bg-neutral-900 hover:bg-neutral-800 text-white text-xs",
              })}
            >
              Lihat Akun & Profil <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
