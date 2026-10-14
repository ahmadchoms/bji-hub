"use client";

import { useState, useTransition } from "react";
import { Order, OrderStatus } from "@/types";
import { formatRupiah } from "@/components/shared/price-text";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateShipmentTrackingAction } from "@/actions/order.actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Package,
  Truck,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  MessageCircle,
  Search,
} from "lucide-react";
import { buildShipmentNotificationUrl } from "@/lib/notifications";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { ShipmentTrackingModal } from "@/components/order/shipment-tracking-modal";
import { OrderPrintModal } from "@/components/order/order-print-modal";

interface SellerOrderListProps {
  orders: Order[];
}

export function SellerOrderList({ orders: initialOrders }: SellerOrderListProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTrackingInput, setActiveTrackingInput] = useState<{
    [orderId: string]: string;
  }>({});
  const [isPending, startTransition] = useTransition();

  const filteredOrders = orders.filter((order) => {
    if (filter === "paid" && order.status !== "paid") return false;
    if (filter === "shipped" && order.status !== "shipped") return false;
    if (filter === "completed" && order.status !== "completed") return false;
    if (filter === "disputed" && order.status !== "disputed") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNumber = order.orderNumber.toLowerCase().includes(q);
      const matchBuyer = order.buyerName.toLowerCase().includes(q);
      const matchResi = order.trackingNumber?.toLowerCase().includes(q);
      const matchTitle = order.listingTitle?.toLowerCase().includes(q);
      const matchCourier = order.shippingCourier?.toLowerCase().includes(q);
      if (!matchNumber && !matchBuyer && !matchResi && !matchTitle && !matchCourier) {
        return false;
      }
    }

    return true;
  });

  const handleUpdateTracking = (orderId: string) => {
    const resi = activeTrackingInput[orderId]?.trim();
    if (!resi) {
      toast.error("Nomor resi tidak boleh kosong");
      return;
    }

    const targetOrder = orders.find((o) => o.id === orderId);

    startTransition(async () => {
      const res = await updateShipmentTrackingAction(orderId, resi);
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, status: "shipped" as OrderStatus, trackingNumber: resi }
              : o,
          ),
        );

        if (targetOrder?.buyerPhone) {
          const waUrl = buildShipmentNotificationUrl({
            buyerPhone: targetOrder.buyerPhone,
            buyerName: targetOrder.buyerName,
            sellerName: targetOrder.sellerName || "Roastery",
            orderNumber: targetOrder.orderNumber,
            listingTitle: targetOrder.listingTitle || "Biji Kopi",
            courier: targetOrder.shippingCourier || "Ekspedisi",
            trackingNumber: resi,
          });

          toast.success("Nomor resi disimpan. Pesanan beralih ke 'Dikirim'.", {
            description: `Beri tahu ${targetOrder.buyerName} via WhatsApp bahwa paket telah dikirim?`,
            duration: 8000,
            action: {
              label: "Kirim WA",
              onClick: () => {
                window.open(waUrl, "_blank", "noopener,noreferrer");
              },
            },
          });
        } else {
          toast.success("Nomor resi berhasil disimpan. Status pesanan diubah ke 'Dikirim'.");
        }
      } else {
        toast.error(res.error || "Gagal memperbarui nomor resi");
      }
    });
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "pending_payment":
        return (
          <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-300">
            <Clock className="w-3 h-3 mr-1" /> Menunggu Pembayaran
          </Badge>
        );
      case "paid":
        return (
          <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-300">
            <Package className="w-3 h-3 mr-1" /> Perlu Dikirim
          </Badge>
        );
      case "shipped":
        return (
          <Badge variant="outline" className="text-purple-700 bg-purple-50 border-purple-300">
            <Truck className="w-3 h-3 mr-1" /> Dalam Pengiriman
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-300">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Selesai
          </Badge>
        );
      case "disputed":
        return (
          <Badge variant="outline" className="text-rose-700 bg-rose-50 border-rose-300">
            <AlertCircle className="w-3 h-3 mr-1" /> Dalam Komplain
          </Badge>
        );
      case "canceled":
        return (
          <Badge variant="outline" className="text-rose-700 bg-rose-50 border-rose-300">
            <AlertCircle className="w-3 h-3 mr-1" /> Dibatalkan
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (orders.length === 0) {
    return (
      <EmptyState
        title="Belum Ada Pesanan"
        description="Pesanan langsung dari pembeli yang menggunakan metode pembayaran online akan muncul di sini."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs & Export */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-neutral-200">
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <button
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
            onClick={() => setFilter("paid")}
            className={`px-3 py-1.5 rounded-sm font-medium transition-colors ${
              filter === "paid"
                ? "bg-blue-700 text-white"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            Perlu Dikirim ({orders.filter((o) => o.status === "paid").length})
          </button>
          <button
            onClick={() => setFilter("shipped")}
            className={`px-3 py-1.5 rounded-sm font-medium transition-colors ${
              filter === "shipped"
                ? "bg-purple-700 text-white"
                : "bg-purple-50 text-purple-700 hover:bg-purple-100"
            }`}
          >
            Dalam Pengiriman ({orders.filter((o) => o.status === "shipped").length})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-3 py-1.5 rounded-sm font-medium transition-colors ${
              filter === "completed"
                ? "bg-emerald-700 text-white"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            Selesai ({orders.filter((o) => o.status === "completed").length})
          </button>
          <button
            onClick={() => setFilter("disputed")}
            className={`px-3 py-1.5 rounded-sm font-medium transition-colors ${
              filter === "disputed"
                ? "bg-rose-700 text-white"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            Komplain ({orders.filter((o) => o.status === "disputed").length})
          </button>
        </div>

        <ExportCsvButton
          data={orders}
          filename={`laporan-pesanan-toko-${format(new Date(), "yyyyMMdd")}`}
          columns={[
            { key: "orderNumber", label: "No Pesanan" },
            {
              key: "createdAt",
              label: "Tanggal",
              format: (val) =>
                val ? format(new Date(val), "yyyy-MM-dd HH:mm", { locale: idLocale }) : "",
            },
            { key: "listingTitle", label: "Produk", format: (val) => val || "-" },
            { key: "quantity", label: "Jumlah" },
            { key: "subtotal", label: "Subtotal Bersih (IDR)" },
            { key: "shippingCourier", label: "Kurir" },
            { key: "trackingNumber", label: "No Resi", format: (val) => val || "-" },
            { key: "buyerName", label: "Nama Pembeli" },
            { key: "buyerPhone", label: "No HP Pembeli" },
            { key: "buyerCity", label: "Kota Tujuan" },
            { key: "status", label: "Status" },
            { key: "disputeReason", label: "Alasan Komplain", format: (val) => val || "-" },
          ]}
          label="Ekspor CSV"
        />
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <Input
          type="text"
          placeholder="Cari no. pesanan, nama pembeli, no. resi, atau produk..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 text-xs bg-white"
        />
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <p className="text-sm text-neutral-500 py-8 text-center">
            Tidak ada pesanan dalam status ini.
          </p>
        ) : (
          filteredOrders.map((order) => {
            const canInputResi =
              order.status === "paid" || order.status === "shipped";

            return (
              <div
                key={order.id}
                className="border border-neutral-300 bg-white rounded-lg p-5 space-y-4 shadow-xs"
              >
                {/* Header Info */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-neutral-900">
                      {order.orderNumber}
                    </span>
                    <span className="text-xs text-neutral-500 font-mono">
                      {format(new Date(order.createdAt), "d MMM yyyy, HH:mm", {
                        locale: idLocale,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <OrderPrintModal order={order} defaultMode="shipping_label" />
                    <div>{getStatusBadge(order.status)}</div>
                  </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-sm">
                  {/* Left: Product & Pricing */}
                  <div className="md:col-span-7 space-y-3">
                    <div>
                      <p className="font-semibold text-neutral-900 text-base">
                        {order.listingTitle || `Produk #${order.listingId}`}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {order.quantity} pcs/kg × {formatRupiah(order.itemPrice)}
                      </p>
                    </div>

                    <div className="p-3 bg-neutral-50 rounded border border-neutral-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-neutral-500">Nilai Bersih Penjual:</span>
                        <p className="font-bold font-mono text-sm text-primary-900">
                          {formatRupiah(order.subtotal)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-neutral-500">Kurir Pengiriman:</span>
                        <p className="font-medium text-neutral-800 flex items-center justify-end gap-1 mt-0.5">
                          <Truck className="w-3.5 h-3.5 text-neutral-600" />
                          {order.shippingCourier}
                        </p>
                      </div>
                    </div>

                    {order.notes && (
                      <div className="text-xs text-neutral-600 bg-amber-50/60 p-2.5 rounded border border-amber-200">
                        <span className="font-medium text-amber-900">Catatan Pembeli:</span>{" "}
                        {order.notes}
                      </div>
                    )}
                  </div>

                  {/* Right: Buyer Address & Tracking Action */}
                  <div className="md:col-span-5 space-y-3 border-t md:border-t-0 md:border-l md:border-neutral-200 md:pl-5 pt-3 md:pt-0">
                    <div>
                      <p className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5 mb-1">
                        <MapPin className="w-3.5 h-3.5 text-neutral-500" /> Alamat Pengiriman
                      </p>
                      <p className="font-medium text-neutral-800">{order.buyerName}</p>
                      <p className="text-xs text-neutral-500 font-mono">{order.buyerPhone}</p>
                      <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                        {order.buyerAddress}, {order.buyerCity}
                      </p>
                    </div>

                    {/* Resi Handler */}
                    <div className="pt-2 border-t border-neutral-100">
                      {order.trackingNumber ? (
                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold text-neutral-700">
                            Nomor Resi:
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs bg-neutral-100 px-2 py-1 rounded text-primary-800 border border-neutral-300">
                              {order.trackingNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(order.trackingNumber || "");
                                toast.success("Nomor resi disalin");
                              }}
                              className="text-neutral-500 hover:text-neutral-800 text-xs flex items-center gap-1"
                              title="Salin Resi"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={buildShipmentNotificationUrl({
                                buyerPhone: order.buyerPhone,
                                buyerName: order.buyerName,
                                sellerName: order.sellerName || "Roastery",
                                orderNumber: order.orderNumber,
                                listingTitle: order.listingTitle || "Biji Kopi",
                                courier: order.shippingCourier || "JNE",
                                trackingNumber: order.trackingNumber,
                              })}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium"
                              title="Kirim notifikasi resi ke WhatsApp pembeli"
                            >
                              <MessageCircle className="w-3 h-3" />
                              Kirim WA
                            </a>
                            <ShipmentTrackingModal
                              trackingNumber={order.trackingNumber}
                              courierCode={order.shippingCourier || "jne"}
                              orderNumber={order.orderNumber}
                            />
                          </div>
                        </div>
                      ) : null}

                      {canInputResi && (
                        <div className="mt-3 space-y-2">
                          <label className="text-xs font-medium text-neutral-700 block">
                            {order.trackingNumber
                              ? "Perbarui Nomor Resi:"
                              : "Input Nomor Resi Pengiriman:"}
                          </label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="text"
                              placeholder="Contoh: JNE012398402"
                              value={
                                activeTrackingInput[order.id] !== undefined
                                  ? activeTrackingInput[order.id]
                                  : order.trackingNumber || ""
                              }
                              onChange={(e) =>
                                setActiveTrackingInput({
                                  ...activeTrackingInput,
                                  [order.id]: e.target.value,
                                })
                              }
                              className="h-8 text-xs font-mono"
                            />
                            <Button
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleUpdateTracking(order.id)}
                              className="h-8 text-xs bg-primary-600 hover:bg-primary-700 text-white shrink-0"
                            >
                              Simpan
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Disputed Alert Banner */}
                {order.status === "disputed" && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-rose-900">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      Pesanan Dalam Komplain Pembeli (Dana Escrow Ditahan)
                    </div>
                    <p className="text-rose-700 pl-5.5">
                      <span className="font-medium">Alasan:</span> {order.disputeReason || "Menunggu verifikasi admin."}
                    </p>
                    {order.disputeEvidenceUrl && (
                      <div className="pl-5.5 pt-1">
                        <a
                          href={order.disputeEvidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-rose-700 underline font-medium hover:text-rose-900"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Lihat Foto Bukti Komplain dari Pembeli
                        </a>
                      </div>
                    )}
                    <p className="text-[11px] text-rose-600 pl-5.5">
                      Admin Biji Hub sedang meninjau kasus ini sebelum memutuskan penerusan dana atau pengembalian ke pembeli.
                    </p>
                  </div>
                )}

                {/* Footer Escrow notice */}
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50/70 px-3 py-1.5 rounded">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Dana escrow otomatis dicairkan ke rekening Anda saat pembeli konfirmasi paket
                    diterima dengan baik.
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
