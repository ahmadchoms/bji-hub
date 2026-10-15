"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Order } from "@/types";
import { formatRupiah } from "@/components/shared/price-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ConfirmOrderButton } from "@/components/order/confirm-order-button";
import { OrderDetailDialog } from "@/components/order/order-detail-dialog";
import {
  ShoppingBag,
  Store,
  MoreHorizontal,
  Package,
  CreditCard,
  Search,
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

function getOrderProductImage(order: Order): string {
  if ((order as unknown as { listingImageUrl?: string }).listingImageUrl) {
    return (order as unknown as { listingImageUrl?: string }).listingImageUrl!;
  }
  return "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&q=80&w=400";
}

export function BuyerOrdersCard({ orders }: BuyerOrdersCardProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

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
    if (filter !== "all" && o.status !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchTitle = (o.listingTitle || "").toLowerCase().includes(q);
      const matchSeller = (o.sellerName || "").toLowerCase().includes(q);
      const matchResi = (o.trackingNumber || "").toLowerCase().includes(q);
      const matchCourier = (o.shippingCourier || "").toLowerCase().includes(q);
      if (!matchNum && !matchTitle && !matchSeller && !matchResi && !matchCourier) {
        return false;
      }
    }
    return true;
  });

  const counts = {
    all: orders.length,
    pending_payment: orders.filter((o) => o.status === "pending_payment").length,
    paid: orders.filter((o) => o.status === "paid").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    completed: orders.filter((o) => o.status === "completed").length,
    disputed: orders.filter((o) => o.status === "disputed").length,
  };

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-300 font-semibold text-[11px]">
            Selesai
          </Badge>
        );
      case "shipped":
        return (
          <Badge variant="outline" className="text-purple-700 bg-purple-50 border-purple-300 font-semibold text-[11px]">
            Dikirim
          </Badge>
        );
      case "paid":
        return (
          <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-300 font-semibold text-[11px]">
            Diproses
          </Badge>
        );
      case "disputed":
        return (
          <Badge variant="outline" className="text-rose-700 bg-rose-50 border-rose-300 font-semibold text-[11px]">
            Komplain
          </Badge>
        );
      case "canceled":
        return (
          <Badge variant="outline" className="text-neutral-600 bg-neutral-100 border-neutral-300 font-semibold text-[11px]">
            Dibatalkan
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-amber-800 bg-amber-50 border-amber-300 font-semibold text-[11px]">
            Menunggu Pembayaran
          </Badge>
        );
    }
  };

  return (
    <Card className="border-neutral-300">
      <CardHeader className="space-y-3 pb-3">
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

        {/* Quick Search Bar */}
        {orders.length > 0 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor pesanan, nama kopi, penjual, atau resi..."
              className="w-full text-xs pl-8 pr-8 py-2 rounded-md border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-400 placeholder:text-neutral-400 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-600 text-xs px-1 py-0.5 rounded cursor-pointer"
                title="Hapus pencarian"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Filter Tabs */}
        {orders.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-neutral-100 text-xs">
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

      <CardContent className="space-y-4 pt-1">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-neutral-200 rounded-lg space-y-1.5">
            <p className="text-xs text-neutral-500">
              {orders.length === 0
                ? "Belum ada riwayat pesanan."
                : searchQuery
                  ? `Tidak ada pesanan yang cocok dengan pencarian "${searchQuery}".`
                  : "Tidak ada pesanan dalam status ini."}
            </p>
            {orders.length === 0 ? (
              <Link
                href="/"
                className="text-xs font-semibold text-primary-600 hover:underline inline-block"
              >
                Jelajahi Pilihan Kopi &rarr;
              </Link>
            ) : searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-xs font-semibold text-primary-600 hover:underline inline-block cursor-pointer"
              >
                Reset Pencarian
              </button>
            ) : null}
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const productImg = getOrderProductImage(ord);

            return (
              <div
                key={ord.id}
                className="p-4 sm:p-5 border border-neutral-200/90 rounded-xl space-y-3.5 bg-white shadow-xs hover:border-neutral-300 transition-colors"
              >
                {/* 1. Baris Atas: Ikon Handbag + Belanja + Tanggal + Status Order + No Order */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                      <ShoppingBag className="w-4 h-4 text-neutral-800 shrink-0" />
                      <span>Belanja</span>
                    </div>
                    <span className="text-neutral-500 text-xs">
                      {format(new Date(ord.createdAt), "d MMM yyyy", { locale: idLocale })}
                    </span>
                    <div>{getStatusBadge(ord.status)}</div>
                    <span className="text-neutral-400 font-mono text-[11px]">
                      {ord.orderNumber}
                    </span>
                  </div>
                </div>

                {/* 2. Baris Toko / Seller */}
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
                  <Store className="w-3.5 h-3.5 text-primary-700 shrink-0" />
                  <span>{ord.sellerName || "Roastery Biji Hub"}</span>
                </div>

                {/* 3. Baris Tengah: Gambar Produk + Nama Produk + Qty | Border Vertikal | Total Belanja */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-0.5">
                  {/* Kiri: Gambar Produk, Nama Produk, Qty */}
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
                      <Image
                        src={productImg}
                        alt={ord.listingTitle || "Produk Kopi"}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      {ord.listingSlug ? (
                        <Link
                          href={`/product/${ord.listingSlug}`}
                          className="font-bold text-neutral-900 text-sm hover:text-primary-700 hover:underline transition-colors line-clamp-1 sm:line-clamp-2"
                        >
                          {ord.listingTitle || `Produk #${ord.listingId}`}
                        </Link>
                      ) : (
                        <p className="font-bold text-neutral-900 text-sm line-clamp-1 sm:line-clamp-2">
                          {ord.listingTitle || `Produk #${ord.listingId}`}
                        </p>
                      )}
                      <p className="text-xs text-neutral-500 mt-1">
                        {ord.quantity} barang x {formatRupiah(ord.itemPrice)}
                        {ord.notes && (
                          <span className="ml-1 text-[11px] text-neutral-400">({ord.notes})</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Kanan: Border Vertikal + Total Belanja */}
                  <div className="border-t sm:border-t-0 sm:border-l border-neutral-200 pt-2 sm:pt-0 sm:pl-6 shrink-0 sm:min-w-[130px]">
                    <span className="text-[11px] text-neutral-500 block">Total Belanja</span>
                    <span className="text-sm sm:text-base font-bold font-mono text-neutral-900 block mt-0.5">
                      {formatRupiah(ord.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* 4. Baris Bawah Kanan: Lihat Detail Transaksi + Beli Lagi + Menu Aksi */}
                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-neutral-100">
                  {/* Tombol Lihat Detail Transaksi */}
                  <OrderDetailDialog
                    order={ord}
                    productImage={productImg}
                    onReorder={handleReorder}
                    onResumePayment={handleResumePayment}
                    onCancelOrder={handleCancelOrder}
                    isPaying={payingId === ord.id}
                    isCanceling={cancelingId === ord.id}
                    trigger={
                      <button
                        type="button"
                        className="text-xs font-semibold text-primary-900 hover:text-primary-700 hover:underline px-2 py-1 cursor-pointer transition-colors"
                      >
                        Lihat Detail Transaksi
                      </button>
                    }
                  />

                  {/* Tombol Aksi Utama */}
                  {ord.status === "pending_payment" ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={payingId === ord.id}
                      onClick={() => handleResumePayment(ord)}
                      className="text-xs font-semibold h-8 px-4 bg-neutral-900 hover:bg-neutral-800 text-white cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                      {payingId === ord.id ? "Memuat..." : "Bayar Sekarang"}
                    </Button>
                  ) : ord.status === "shipped" ? (
                    <div className="flex items-center gap-2">
                      <ConfirmOrderButton
                        orderId={ord.id}
                        orderNumber={ord.orderNumber}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleReorder(ord)}
                        className="bg-[#2E150C] hover:bg-[#3D1D10] text-white text-xs font-semibold h-8 px-4 cursor-pointer"
                      >
                        Beli Lagi
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleReorder(ord)}
                      className="bg-[#2E150C] hover:bg-[#3D1D10] text-white text-xs font-semibold h-8 px-4 cursor-pointer"
                    >
                      Beli Lagi
                    </Button>
                  )}

                  {/* Tombol Menu Titik Tiga (...) sesuai Tokopedia */}
                  <OrderDetailDialog
                    order={ord}
                    productImage={productImg}
                    onReorder={handleReorder}
                    onResumePayment={handleResumePayment}
                    onCancelOrder={handleCancelOrder}
                    isPaying={payingId === ord.id}
                    isCanceling={cancelingId === ord.id}
                    trigger={
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        className="w-8 h-8 rounded-md border-neutral-300 text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                        title="Opsi Lainnya"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    }
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
