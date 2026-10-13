import type { Metadata } from "next";
import Link from "next/link";
import { getOrderById } from "@/lib/data/orders";
import { PageContainer } from "@/components/layout/page-container";
import { formatRupiah } from "@/components/shared/price-text";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  Truck,
  Package,
  MapPin,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

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
          <Link href="/catalog" className={buttonVariants({ className: "w-full" })}>
            Kembali ke Katalog
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
            {isPaid ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : (
              <Clock className="w-8 h-8 text-amber-600" />
            )}
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold font-display text-neutral-900">
              {isPaid ? "Pembayaran Dikonfirmasi!" : "Pesanan Berhasil Dibuat"}
            </h1>
            <p className="text-sm text-neutral-600">
              Nomor Pesanan: <span className="font-mono font-bold text-neutral-900">{order.orderNumber}</span>
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Garansi Escrow Biji Hub Aktif (Dana Aman Terlindungi)
          </div>

          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            {isPaid
              ? "Dana Anda telah aman tertampung di rekening escrow resmi Biji Hub. Penjual telah diberitahu untuk segera memproses & mengirimkan pesanan."
              : "Menunggu penyelesaian pembayaran. Jika sudah membayar melalui Snap Midtrans, status pesanan akan terbarui secara otomatis."}
          </p>
        </div>

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
                  <div className="mt-2 p-2 bg-neutral-50 rounded border border-neutral-200 text-xs">
                    <span className="text-neutral-500">Nomor Resi:</span>{" "}
                    <span className="font-mono font-bold text-primary-700">{order.trackingNumber}</span>
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
            href="/catalog"
            className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}
          >
            Lanjut Belanja di Katalog
          </Link>

          <Link
            href="/profile"
            className={buttonVariants({
              className: "w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white",
            })}
          >
            Lihat Akun & Profil <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </PageContainer>
    </div>
  );
}
