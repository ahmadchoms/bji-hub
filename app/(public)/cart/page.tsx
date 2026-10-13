"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { PageContainer } from "@/components/layout/page-container";
import { formatRupiah } from "@/components/shared/price-text";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Store,
  ArrowRight,
  ShieldCheck,
  Package,
} from "lucide-react";

export default function CartPage() {
  const {
    isLoaded,
    items,
    totalItems,
    totalAmount,
    groupedBySeller,
    updateCartQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  if (!isLoaded) {
    return (
      <div className="py-16 text-center">
        <PageContainer className="max-w-md mx-auto space-y-4">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-500">Memuat keranjang belanja...</p>
        </PageContainer>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 md:py-24 text-center">
        <PageContainer className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold font-display text-neutral-900">
            Keranjang Belanja Masih Kosong
          </h1>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
            Temukan biji kopi specialty pilihan langsung dari petani dan roastery terbaik di seluruh Indonesia.
          </p>
          <div className="pt-2">
            <Link
              href="/catalog"
              className={buttonVariants({
                className: "bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-6",
              })}
            >
              Jelajahi Katalog Biji Kopi
            </Link>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12 bg-neutral-50/50 min-h-[80vh]">
      <PageContainer className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold font-display text-neutral-900 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-primary-600" /> Keranjang Belanja
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              {totalItems} item dari {Object.keys(groupedBySeller).length} mitra roastery
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCart}
            className="text-xs text-neutral-500 hover:text-rose-600 self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Kosongkan Keranjang
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main List Grouped by Seller */}
          <div className="lg:col-span-8 space-y-6">
            {Object.entries(groupedBySeller).map(([sellerId, group]) => {
              const sellerTotal = group.items.reduce(
                (sum, i) => sum + i.price * i.quantity,
                0,
              );
              const firstSlug = group.items[0]?.slug;

              return (
                <div
                  key={sellerId}
                  className="bg-white border border-neutral-300 rounded-lg p-5 space-y-4 shadow-xs"
                >
                  {/* Seller Header */}
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center font-bold text-xs">
                        <Store className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neutral-900">
                          {group.sellerName}
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          Pengiriman dari: {group.sellerCity}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-neutral-600">
                      {group.items.length} Produk
                    </Badge>
                  </div>

                  {/* Items list */}
                  <div className="divide-y divide-neutral-100">
                    {group.items.map((item) => (
                      <div
                        key={item.listingId}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400 shrink-0">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <Package className="w-5 h-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/product/${item.slug}`}
                              className="font-semibold text-neutral-900 hover:text-primary-700 truncate block text-sm"
                            >
                              {item.title}
                            </Link>
                            <p className="text-neutral-500 mt-0.5">
                              {formatRupiah(item.price)} / {item.unit}
                            </p>
                            <span className="text-[10px] text-neutral-400">
                              Min. order: {item.minOrderQty} {item.unit}
                            </span>
                          </div>
                        </div>

                        {/* Stepper & Total */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 self-end sm:self-auto w-full sm:w-auto">
                          {/* Stepper */}
                          <div className="flex items-center border border-neutral-300 rounded overflow-hidden">
                            <button
                              type="button"
                              onClick={() =>
                                updateCartQuantity(item.listingId, item.quantity - 1)
                              }
                              className="w-7 h-7 flex items-center justify-center bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border-r border-neutral-300"
                              title="Kurangi"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-9 text-center font-mono font-semibold text-neutral-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateCartQuantity(item.listingId, item.quantity + 1)
                              }
                              className="w-7 h-7 flex items-center justify-center bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border-l border-neutral-300"
                              title="Tambah"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Subtotal */}
                          <div className="text-right min-w-[90px]">
                            <p className="font-mono font-bold text-neutral-900">
                              {formatRupiah(item.price * item.quantity)}
                            </p>
                          </div>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.listingId)}
                            className="text-neutral-400 hover:text-rose-600 p-1"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Seller Checkout CTA */}
                  <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50/70 p-3 rounded">
                    <div>
                      <span className="text-[11px] text-neutral-500">Subtotal Toko:</span>
                      <p className="font-mono font-bold text-sm text-primary-900">
                        {formatRupiah(sellerTotal)}
                      </p>
                    </div>

                    <Link
                      href={`/checkout/${firstSlug}`}
                      className={buttonVariants({
                        size: "sm",
                        className:
                          "bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-4 gap-1.5",
                      })}
                    >
                      Beli dari Toko Ini <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky Summary Card */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="border-neutral-300 bg-white shadow-xs">
              <CardHeader className="pb-3 border-b border-neutral-100">
                <CardTitle className="text-sm text-neutral-900">
                  Ringkasan Belanja
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Total Produk ({totalItems} item)</span>
                  <span className="font-mono font-semibold text-neutral-900">
                    {formatRupiah(totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-500 text-[11px]">
                  <span>Ongkos Kirim & Asuransi</span>
                  <span className="italic">Dihitung saat checkout</span>
                </div>

                <div className="pt-3 border-t border-neutral-200 flex justify-between items-baseline font-bold text-sm">
                  <span className="text-neutral-900">Total Estimasi</span>
                  <span className="font-mono text-primary-700 text-base">
                    {formatRupiah(totalAmount)}
                  </span>
                </div>

                <div className="p-3 bg-emerald-50 rounded border border-emerald-200 text-[11px] text-emerald-800 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    Garansi Rekening Escrow Biji Hub
                  </div>
                  <p className="leading-relaxed">
                    Pembayaran aman tertampung di rekening bersama resmi sampai pesanan kopi Anda terima dengan selamat.
                  </p>
                </div>

                <Link
                  href="/catalog"
                  className={buttonVariants({
                    variant: "outline",
                    className: "w-full text-xs text-neutral-700",
                  })}
                >
                  Tambah Kopi Lainnya
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
