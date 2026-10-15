"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Order } from "@/types";
import { formatRupiah } from "@/components/shared/price-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ConfirmOrderButton } from "@/components/order/confirm-order-button";
import { OrderReviewModal } from "@/components/order/order-review-modal";
import { OrderDisputeModal } from "@/components/order/order-dispute-modal";
import { ShipmentTrackingModal } from "@/components/order/shipment-tracking-modal";
import { OrderPrintModal } from "@/components/order/order-print-modal";
import { OrderStatusStepper } from "@/components/order/order-status-stepper";
import {
  Package,
  Clock,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  ExternalLink,
  CreditCard,
  XCircle,
  MessageCircle,
  Copy,
  Check,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import { addToCart } from "@/lib/cart";
import {
  resumeOrderPaymentAction,
  cancelPendingOrderAction,
} from "@/actions/order.actions";

interface BuyerOrdersCardProps {
  orders: Order[];
}

type OrderFilter = "all" | "pending_payment" | "paid" | "shipped" | "completed" | "disputed";

export function BuyerOrdersCard({ orders }: BuyerOrdersCardProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [copiedResiId, setCopiedResiId] = useState<string | null>(null);

  const handleCopyResi = (trackingNumber: string, orderId: string) => {
    navigator.clipboard.writeText(trackingNumber);
    setCopiedResiId(orderId);
    toast.success("Nomor resi kurir disalin!");
    setTimeout(() => setCopiedResiId(null), 2000);
  };

  const handleReorder = (ord: Order) => {
    addToCart({
      listingId: ord.listingId,
      slug: ord.listingSlug || ord.listingId,
      title: ord.listingTitle || "Biji Kopi",
      price: ord.itemPrice,
      unit: "kg",
      minOrderQty: 1,
      quantity: ord.quantity || 1,
      sellerId: ord.sellerId,
      sellerName: ord.sellerName || "Roastery Penjual",
      sellerCity: ord.buyerCity || "Indonesia",
    });
    toast.success(`"${ord.listingTitle || "Biji Kopi"}" berhasil ditambahkan ke keranjang belanja!`);
    router.push("/cart");
  };

  const handleResumePayment = async (order: Order) => {
    setPayingId(order.id);
    const res = await resumeOrderPaymentAction(order.id);
    setPayingId(null);
    if (!res.success) {
      toast.error(res.error || "Gagal memproses pembayaran");
      return;
    }
    const { snapToken } = res.data;
    if (
      snapToken &&
      typeof window !== "undefined" &&
      (window as unknown as { snap?: { pay: (token: string, options: unknown) => void } }).snap
    ) {
      const snap = (window as unknown as { snap: { pay: (token: string, options: unknown) => void } }).snap;
      snap.pay(snapToken, {
        onSuccess: async () => {
          toast.success("Pembayaran berhasil!");
          router.push(`/order/success?orderNumber=${order.orderNumber}`);
        },
        onPending: () => {
          toast.info("Menunggu pembayaran diselesaikan.");
        },
        onError: () => {
          toast.error("Pembayaran gagal. Silakan coba kembali.");
        },
        onClose: () => {
          toast.info("Jendela pembayaran ditutup.");
        },
      });
    } else {
      router.push(`/order/success?orderNumber=${order.orderNumber}`);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) return;
    setCancelingId(orderId);
    const res = await cancelPendingOrderAction(orderId);
    setCancelingId(null);
    if (res.success) {
      toast.success("Pesanan berhasil dibatalkan");
      router.refresh();
    } else {
      toast.error(res.error || "Gagal membatalkan pesanan");
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === "all") return true;
    return o.status === filter;
  });

  const counts = {
    all: orders.length,
    pending_payment: orders.filter((o) => o.status === "pending_payment").length,
    paid: orders.filter((o) => o.status === "paid").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    completed: orders.filter((o) => o.status === "completed").length,
    disputed: orders.filter((o) => o.status === "disputed").length,
  };

  return (
    <Card className="border-neutral-300">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base text-neutral-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary-600" />
              Riwayat Pesanan Saya
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500">
              Daftar transaksi langsung dan status pengiriman biji kopi Anda.
            </CardDescription>
          </div>
          <span className="font-mono text-xs text-neutral-500">
            {orders.length} Total Pesanan
          </span>
        </div>

        {/* Filter Tabs */}
        {orders.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-neutral-100 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded-sm text-xs font-medium transition-colors shrink-0 ${
                filter === "all"
                  ? "bg-neutral-900 text-white font-semibold"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              Semua ({counts.all})
            </button>
            <button
              onClick={() => setFilter("pending_payment")}
              className={`px-2.5 py-1 rounded-sm text-xs font-medium transition-colors shrink-0 ${
                filter === "pending_payment"
                  ? "bg-neutral-900 text-white font-semibold"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              Belum Bayar ({counts.pending_payment})
            </button>
            <button
              onClick={() => setFilter("paid")}
              className={`px-2.5 py-1 rounded-sm text-xs font-medium transition-colors shrink-0 ${
                filter === "paid"
                  ? "bg-neutral-900 text-white font-semibold"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              Diproses ({counts.paid})
            </button>
            <button
              onClick={() => setFilter("shipped")}
              className={`px-2.5 py-1 rounded-sm text-xs font-medium transition-colors shrink-0 ${
                filter === "shipped"
                  ? "bg-neutral-900 text-white font-semibold"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              Dikirim ({counts.shipped})
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-2.5 py-1 rounded-sm text-xs font-medium transition-colors shrink-0 ${
                filter === "completed"
                  ? "bg-neutral-900 text-white font-semibold"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              Selesai ({counts.completed})
            </button>
            <button
              onClick={() => setFilter("disputed")}
              className={`px-2.5 py-1 rounded-sm text-xs font-medium transition-colors shrink-0 ${
                filter === "disputed"
                  ? "bg-rose-700 text-white font-semibold"
                  : counts.disputed > 0
                    ? "bg-rose-50 text-rose-700 hover:bg-rose-100 font-medium"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              Komplain ({counts.disputed})
            </button>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-neutral-200 rounded-sm">
            <p className="text-xs text-neutral-500">
              {orders.length === 0
                ? "Belum ada riwayat pesanan."
                : "Tidak ada pesanan dalam status ini."}
            </p>
            {orders.length === 0 && (
              <Link
                href="/"
                className="text-xs font-semibold text-primary-600 hover:underline mt-1 inline-block"
              >
                Jelajahi Pilihan Kopi &rarr;
              </Link>
            )}
          </div>
        ) : (
          filteredOrders.map((ord) => {
            // Auto complete deadline calculation: 48 hours from last updated/shipped date
            const shippedTimestamp = new Date(ord.updatedAt || ord.createdAt).getTime();
            const autoReleaseDate = new Date(shippedTimestamp + 48 * 60 * 60 * 1000);
            const isAutoReleasePassed = Date.now() > autoReleaseDate.getTime();

            return (
              <div
                key={ord.id}
                className="p-3.5 border border-neutral-200 rounded-sm space-y-2.5 text-xs hover:border-neutral-300 transition-colors bg-white shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-neutral-900">
                      {ord.orderNumber}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      {format(new Date(ord.createdAt), "d MMM yyyy", { locale: idLocale })}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      ord.status === "completed"
                        ? "text-emerald-700 bg-emerald-50 border-emerald-300"
                        : ord.status === "disputed"
                          ? "text-rose-700 bg-rose-50 border-rose-300"
                          : ord.status === "shipped"
                            ? "text-purple-700 bg-purple-50 border-purple-300"
                            : ord.status === "paid"
                              ? "text-blue-700 bg-blue-50 border-blue-300"
                              : "text-amber-700 bg-amber-50 border-amber-300"
                    }
                  >
                    {ord.status === "completed"
                      ? "Selesai"
                      : ord.status === "disputed"
                        ? "Komplain"
                        : ord.status === "shipped"
                          ? "Dikirim"
                          : ord.status === "paid"
                            ? "Diproses"
                            : "Menunggu Bayar"}
                  </Badge>
                </div>

                <div className="flex justify-between items-baseline text-neutral-700">
                  <div>
                    {ord.listingSlug ? (
                      <Link
                        href={`/product/${ord.listingSlug}`}
                        className="font-medium text-neutral-900 hover:text-primary-700 hover:underline transition-colors"
                      >
                        {ord.listingTitle || `Produk #${ord.listingId}`}
                      </Link>
                    ) : (
                      <span className="font-medium text-neutral-900">
                        {ord.listingTitle || `Produk #${ord.listingId}`}
                      </span>
                    )}
                    <span className="text-neutral-500 text-[11px] ml-1.5">
                      ({ord.quantity} pcs/kg)
                    </span>
                  </div>
                  <span className="font-mono font-bold text-primary-900">
                    {formatRupiah(ord.totalAmount)}
                  </span>
                </div>

                {/* Status Timeline Tracking Stepper */}
                <div className="pt-2 pb-1 border-t border-neutral-100">
                  <OrderStatusStepper status={ord.status} />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-100 text-[11px] text-neutral-500">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>
                      Kurir: <strong className="text-neutral-700">{ord.shippingCourier || "Reguler"}</strong>
                    </span>
                    {ord.trackingNumber && (
                      <div className="flex items-center gap-1.5 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                        <span className="font-mono font-bold text-neutral-800 text-[10px]">
                          {ord.trackingNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyResi(ord.trackingNumber!, ord.id)}
                          className="text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-0.5 cursor-pointer"
                          title="Salin nomor resi kurir"
                        >
                          {copiedResiId === ord.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span className="text-[10px] font-medium">
                            {copiedResiId === ord.id ? "Tersalin" : "Salin"}
                          </span>
                        </button>
                      </div>
                    )}
                    {ord.trackingNumber && (
                      <ShipmentTrackingModal
                        trackingNumber={ord.trackingNumber}
                        courierCode={ord.shippingCourier || "jne"}
                        orderNumber={ord.orderNumber}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/6281234567890?text=${encodeURIComponent(
                        `Halo ${ord.sellerName || "Roastery Biji Hub"}, saya pembeli untuk pesanan #${ord.orderNumber} (${ord.listingTitle || "Kopi"}). Ingin menanyakan status pesanan saya. Terima kasih!`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-medium bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition-colors"
                      title="Hubungi penjual via WhatsApp"
                    >
                      <MessageCircle className="w-3 h-3 text-emerald-600" />
                      Chat Penjual
                    </a>
                    <OrderPrintModal order={ord} defaultMode="invoice" />
                    <Link
                      href={`/order/success?orderNumber=${ord.orderNumber}`}
                      className="font-medium text-primary-600 hover:text-primary-800 flex items-center gap-0.5"
                    >
                      Rincian <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Pending Payment Action Banner */}
                {ord.status === "pending_payment" && (() => {
                  const createdTime = new Date(ord.createdAt).getTime();
                  const expireDate = new Date(createdTime + 24 * 60 * 60 * 1000);
                  const isExpired = Date.now() > expireDate.getTime();

                  return (
                    <div className="pt-2 border-t border-neutral-100 space-y-2 bg-amber-50/70 p-2.5 rounded border border-amber-200 text-xs">
                      <div className="flex items-start gap-1.5 text-[11px] text-amber-900">
                        <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-amber-950">
                            {isExpired
                              ? "Batas Waktu Pembayaran Telah Berakhir"
                              : "Menunggu Penyelesaian Pembayaran (Batas 24 Jam)"}
                          </p>
                          <p className="text-amber-800 text-[10px] mt-0.5">
                            {isExpired
                              ? "Silakan batalkan pesanan ini atau hubungi tim Biji Hub jika sudah transfer."
                              : `Selesaikan pembayaran sebelum ${format(expireDate, "d MMMM yyyy, HH:mm", { locale: idLocale })} agar pesanan segera diproses penjual.`}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-200/60">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={cancelingId === ord.id}
                          onClick={() => handleCancelOrder(ord.id)}
                          className="text-[11px] h-7 px-2 text-rose-700 hover:text-rose-800 hover:bg-rose-50 cursor-pointer"
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          {cancelingId === ord.id ? "Membatalkan..." : "Batalkan Pesanan"}
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          disabled={payingId === ord.id || isExpired}
                          onClick={() => handleResumePayment(ord)}
                          className="text-[11px] h-7 px-3 bg-neutral-900 hover:bg-neutral-800 text-white cursor-pointer"
                        >
                          <CreditCard className="w-3 h-3 mr-1" />
                          {payingId === ord.id ? "Memuat..." : "Bayar Sekarang"}
                        </Button>
                      </div>
                    </div>
                  );
                })()}

                {/* Shipped & Auto-Complete Countdown Alert */}
                {ord.status === "shipped" && (
                  <div className="pt-2 border-t border-neutral-100 space-y-2 bg-emerald-50/60 p-2.5 rounded border border-emerald-200">
                    <div className="flex items-start gap-1.5 text-[11px] text-emerald-900">
                      <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">
                          Garansi Konfirmasi Otomatis (2x24 Jam)
                        </p>
                        <p className="text-emerald-800 text-[10px] mt-0.5 leading-relaxed">
                          {isAutoReleasePassed
                            ? "Batas waktu 2x24 jam telah tercapai. Pesanan akan diselesaikan otomatis jika tidak ada kendala."
                            : `Periksa fisik kopi sebelum ${format(autoReleaseDate, "d MMMM yyyy, HH:mm", { locale: idLocale })}. Jika sesuai, silakan konfirmasi penerimaan di bawah.`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-emerald-200/60">
                      <span className="text-[10px] font-medium text-emerald-800">
                        Paket sudah tiba dengan selamat?
                      </span>
                      <div className="flex items-center gap-1.5">
                        <OrderDisputeModal orderId={ord.id} orderNumber={ord.orderNumber} />
                        <ConfirmOrderButton
                          orderId={ord.id}
                          orderNumber={ord.orderNumber}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Disputed Alert Banner */}
                {ord.status === "disputed" && (
                  <div className="pt-2 border-t border-neutral-100 space-y-1.5 bg-rose-50/80 p-2.5 rounded border border-rose-200 text-[11px] text-rose-800">
                    <div className="flex items-center gap-1.5 font-semibold text-rose-950">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      Komplain Anda Sedang Dalam Peninjauan & Mediasi
                    </div>
                    <p className="text-rose-800">
                      <span className="font-medium">Kendala yang dilaporkan:</span>{" "}
                      &ldquo;{ord.disputeReason || "Kendala kualitas/pengiriman produk kopi."}&rdquo;
                    </p>
                    {ord.disputeEvidenceUrl && (
                      <div className="pt-0.5">
                        <a
                          href={ord.disputeEvidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-rose-700 underline font-medium hover:text-rose-900"
                        >
                          <ExternalLink className="w-3 h-3" /> Foto Bukti Kendala Terlampir
                        </a>
                      </div>
                    )}
                    <p className="text-[10px] text-rose-600 pt-0.5 border-t border-rose-200/60">
                      Dana transaksi Anda tetap aman terlindungi di sistem Biji Hub dan tidak akan diteruskan ke penjual sampai kendala terselesaikan.
                    </p>
                  </div>
                )}

                {/* Completed Action */}
                {ord.status === "completed" && (
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] gap-2">
                    <span className="text-neutral-500 inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Transaksi selesai
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleReorder(ord)}
                        className="text-[11px] h-7 px-2.5 gap-1 text-neutral-800 border-neutral-300 hover:bg-neutral-100 cursor-pointer font-medium"
                        title="Beli lot kopi ini lagi"
                      >
                        <RotateCcw className="w-3 h-3 text-neutral-600" />
                        <span>Pesan Lagi</span>
                      </Button>
                      <OrderReviewModal
                        orderId={ord.id}
                        listingId={ord.listingId}
                        listingTitle={ord.listingTitle || "Biji Kopi"}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
