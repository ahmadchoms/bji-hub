"use client";

import { useState, useTransition } from "react";
import type { Order, OrderStatus } from "@/types";
import { formatRupiah } from "@/components/shared/price-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExportCsvButton, type CsvColumn } from "@/components/shared/export-csv-button";
import { resolveDisputeAction } from "@/actions/order.actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  AlertCircle,
  CheckCircle2,
  Package,
  Truck,
  Clock,
  ShieldCheck,
  RotateCcw,
  User,
  Store,
} from "lucide-react";

interface AdminOrderDisputesProps {
  orders: Order[];
}

const ORDER_COLUMNS: CsvColumn<Order>[] = [
  { key: "orderNumber", label: "No Pesanan" },
  {
    key: "createdAt",
    label: "Tanggal",
    format: (val) =>
      val ? format(new Date(val), "yyyy-MM-dd HH:mm", { locale: idLocale }) : "",
  },
  { key: "buyerName", label: "Nama Pembeli" },
  { key: "buyerPhone", label: "No HP Pembeli" },
  { key: "buyerCity", label: "Kota Pembeli" },
  { key: "sellerName", label: "Nama Penjual", format: (val) => val || "-" },
  { key: "listingTitle", label: "Produk", format: (val) => val || "-" },
  { key: "quantity", label: "Jumlah" },
  { key: "subtotal", label: "Subtotal (IDR)" },
  { key: "shippingCost", label: "Ongkir (IDR)" },
  { key: "serviceFee", label: "Biaya Layanan (IDR)" },
  { key: "totalAmount", label: "Total Pembayaran (IDR)" },
  { key: "shippingCourier", label: "Kurir" },
  { key: "trackingNumber", label: "No Resi", format: (val) => val || "-" },
  { key: "status", label: "Status" },
  { key: "disputeReason", label: "Alasan Komplain", format: (val) => val || "-" },
];

export function AdminOrderDisputes({ orders: initialOrders }: AdminOrderDisputesProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filter, setFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  const disputedCount = orders.filter((o) => o.status === "disputed").length;

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    if (filter === "disputed") return order.status === "disputed";
    if (filter === "paid") return order.status === "paid";
    if (filter === "shipped") return order.status === "shipped";
    if (filter === "completed") return order.status === "completed";
    if (filter === "canceled") return order.status === "canceled";
    return true;
  });

  const handleResolve = (orderId: string, decision: "complete" | "cancel") => {
    const confirmMessage =
      decision === "complete"
        ? "Yakin ingin menyelesaikan pesanan ini dan melepas dana escrow ke penjual?"
        : "Yakin ingin membatalkan pesanan ini dan merefund dana ke pembeli?";

    if (!window.confirm(confirmMessage)) return;

    startTransition(async () => {
      const res = await resolveDisputeAction(orderId, decision);
      if (res.success) {
        const newStatus: OrderStatus = decision === "complete" ? "completed" : "canceled";
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
        );
        toast.success(
          decision === "complete"
            ? "Komplain diselesaikan: Pesanan selesai dan dana diteruskan ke penjual."
            : "Komplain diselesaikan: Pesanan dibatalkan untuk proses refund pembeli.",
        );
      } else {
        toast.error(res.error || "Gagal menyelesaikan komplain");
      }
    });
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "pending_payment":
        return (
          <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-300 text-xs">
            <Clock className="w-3 h-3 mr-1" /> Menunggu Pembayaran
          </Badge>
        );
      case "paid":
        return (
          <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-300 text-xs">
            <Package className="w-3 h-3 mr-1" /> Perlu Dikirim
          </Badge>
        );
      case "shipped":
        return (
          <Badge variant="outline" className="text-purple-700 bg-purple-50 border-purple-300 text-xs">
            <Truck className="w-3 h-3 mr-1" /> Dikirim
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-300 text-xs">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Selesai
          </Badge>
        );
      case "disputed":
        return (
          <Badge variant="outline" className="text-rose-700 bg-rose-50 border-rose-300 text-xs font-bold">
            <AlertCircle className="w-3 h-3 mr-1" /> Komplain Pembeli
          </Badge>
        );
      case "canceled":
        return (
          <Badge variant="outline" className="text-neutral-600 bg-neutral-100 border-neutral-300 text-xs">
            Dibatalkan
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            Semua ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("disputed")}
            className={`px-3 py-1.5 rounded-sm font-medium transition-colors flex items-center gap-1 ${
              filter === "disputed"
                ? "bg-rose-700 text-white"
                : disputedCount > 0
                  ? "bg-rose-100 text-rose-800 font-bold border border-rose-300 hover:bg-rose-200"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            Komplain ({disputedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("paid")}
            className={`px-3 py-1.5 rounded-sm font-medium transition-colors ${
              filter === "paid"
                ? "bg-blue-700 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            Perlu Dikirim ({orders.filter((o) => o.status === "paid").length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("shipped")}
            className={`px-3 py-1.5 rounded-sm font-medium transition-colors ${
              filter === "shipped"
                ? "bg-purple-700 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            Dikirim ({orders.filter((o) => o.status === "shipped").length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("completed")}
            className={`px-3 py-1.5 rounded-sm font-medium transition-colors ${
              filter === "completed"
                ? "bg-emerald-700 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            Selesai ({orders.filter((o) => o.status === "completed").length})
          </button>
        </div>

        <ExportCsvButton
          data={orders}
          filename={`laporan-pesanan-biji-hub-${format(new Date(), "yyyyMMdd")}`}
          columns={ORDER_COLUMNS}
          label="Ekspor CSV Pesanan"
        />
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <p className="text-xs text-neutral-500 py-8 text-center bg-white rounded border border-neutral-200">
            Tidak ada pesanan dalam kategori ini.
          </p>
        ) : (
          filteredOrders.map((order) => {
            const isDisputed = order.status === "disputed";

            return (
              <div
                key={order.id}
                className={`border rounded-lg p-4 bg-white space-y-3 text-xs ${
                  isDisputed ? "border-rose-300 ring-1 ring-rose-200" : "border-neutral-200"
                }`}
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-neutral-900 text-sm">
                      {order.orderNumber}
                    </span>
                    <span className="text-neutral-400 font-mono text-[11px]">
                      {format(new Date(order.createdAt), "d MMM yyyy, HH:mm", {
                        locale: idLocale,
                      })}
                    </span>
                  </div>
                  <div>{getStatusBadge(order.status)}</div>
                </div>

                {/* Dispute Alert & Action Box */}
                {isDisputed && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-900 space-y-2">
                    <div className="flex items-center gap-1.5 font-semibold text-rose-800">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      Komplain Pembeli & Penahanan Dana Escrow
                    </div>
                    <p className="text-rose-800 leading-relaxed pl-5.5">
                      <span className="font-semibold">Alasan Pembeli:</span>{" "}
                      {order.disputeReason || "Tidak disertakan rincian."}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 pl-5.5">
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleResolve(order.id, "complete")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs font-medium"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                        Lepas Dana ke Penjual
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => handleResolve(order.id, "cancel")}
                        className="text-rose-700 border-rose-300 hover:bg-rose-100 h-7 text-xs font-medium"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        Batalkan & Refund ke Pembeli
                      </Button>
                    </div>
                  </div>
                )}

                {/* Grid Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <span className="text-neutral-400 block mb-0.5 font-medium">Produk:</span>
                    <p className="font-semibold text-neutral-800">
                      {order.listingTitle || `Produk #${order.listingId}`}
                    </p>
                    <p className="text-neutral-500 text-[11px] mt-0.5">
                      {order.quantity} pcs &bull; Total:{" "}
                      <strong className="text-primary-900 font-mono">
                        {formatRupiah(order.totalAmount)}
                      </strong>
                    </p>
                  </div>

                  <div>
                    <span className="text-neutral-400 block mb-0.5 font-medium">Pembeli:</span>
                    <p className="text-neutral-800 flex items-center gap-1">
                      <User className="w-3 h-3 text-neutral-400" />
                      {order.buyerName} ({order.buyerCity})
                    </p>
                    <p className="text-neutral-500 font-mono text-[11px] mt-0.5">
                      {order.buyerPhone}
                    </p>
                  </div>

                  <div>
                    <span className="text-neutral-400 block mb-0.5 font-medium">Penjual & Kurir:</span>
                    <p className="text-neutral-800 flex items-center gap-1">
                      <Store className="w-3 h-3 text-neutral-400" />
                      {order.sellerName || "Mitra Roastery"}
                    </p>
                    <p className="text-neutral-500 text-[11px] mt-0.5">
                      Kurir: {order.shippingCourier}{" "}
                      {order.trackingNumber && (
                        <span className="font-mono text-neutral-700">({order.trackingNumber})</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
