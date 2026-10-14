"use client";

import { useState } from "react";
import Link from "next/link";
import { Order } from "@/types";
import { formatRupiah } from "@/components/shared/price-text";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ConfirmOrderButton } from "@/components/order/confirm-order-button";
import { OrderReviewModal } from "@/components/order/order-review-modal";
import { OrderDisputeModal } from "@/components/order/order-dispute-modal";
import { ShipmentTrackingModal } from "@/components/order/shipment-tracking-modal";
import { OrderPrintModal } from "@/components/order/order-print-modal";
import { Package, Clock, ShieldCheck, ArrowRight, AlertCircle, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface BuyerOrdersCardProps {
  orders: Order[];
}

type OrderFilter = "all" | "pending_payment" | "paid" | "shipped" | "completed" | "disputed";

export function BuyerOrdersCard({ orders }: BuyerOrdersCardProps) {
  const [filter, setFilter] = useState<OrderFilter>("all");

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
                    <span className="font-medium text-neutral-900">
                      {ord.listingTitle || `Produk #${ord.listingId}`}
                    </span>
                    <span className="text-neutral-500 text-[11px] ml-1.5">
                      ({ord.quantity} pcs/kg)
                    </span>
                  </div>
                  <span className="font-mono font-bold text-primary-900">
                    {formatRupiah(ord.totalAmount)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-100 text-[11px] text-neutral-500">
                  <div className="flex items-center gap-2">
                    <span>
                      Kurir: {ord.shippingCourier}{" "}
                      {ord.trackingNumber && `(Resi: ${ord.trackingNumber})`}
                    </span>
                    {ord.trackingNumber && (
                      <ShipmentTrackingModal
                        trackingNumber={ord.trackingNumber}
                        courierCode={ord.shippingCourier || "jne"}
                        orderNumber={ord.orderNumber}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <OrderPrintModal order={ord} defaultMode="invoice" />
                    <Link
                      href={`/order/success?orderNumber=${ord.orderNumber}`}
                      className="font-medium text-primary-600 hover:text-primary-800 flex items-center gap-0.5"
                    >
                      Rincian <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Shipped & Escrow Auto-Complete Countdown Alert */}
                {ord.status === "shipped" && (
                  <div className="pt-2 border-t border-neutral-100 space-y-2 bg-emerald-50/60 p-2.5 rounded border border-emerald-200">
                    <div className="flex items-start gap-1.5 text-[11px] text-emerald-900">
                      <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">
                          Garansi Konfirmasi Otomatis (Escrow 2x24 Jam)
                        </p>
                        <p className="text-emerald-800 text-[10px] mt-0.5 leading-relaxed">
                          {isAutoReleasePassed
                            ? "Batas waktu 2x24 jam telah tercapai. Dana akan dicairkan otomatis ke penjual jika tidak ada komplain."
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
                      Dana Anda tetap aman tertampung di rekening escrow resmi Biji Hub dan tidak akan dicairkan ke penjual sampai kendala terselesaikan.
                    </p>
                  </div>
                )}

                {/* Completed Action */}
                {ord.status === "completed" && (
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500 inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Transaksi selesai & aman
                    </span>
                    <OrderReviewModal
                      orderId={ord.id}
                      listingId={ord.listingId}
                      listingTitle={ord.listingTitle || "Biji Kopi"}
                    />
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
