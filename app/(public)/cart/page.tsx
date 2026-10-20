"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart";
import { PageContainer } from "@/components/layout/page-container";
import { formatRupiah } from "@/components/shared/price-text";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { checkAuthAction } from "@/actions/auth.actions";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Store,
  ArrowRight,
  Package,
} from "lucide-react";

export default function CartPage() {
  const {
    isLoaded,
    items,
    totalItems,
    groupedBySeller,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    getItemKey,
  } = useCart();

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuthAction().then((authed) => setIsLoggedIn(authed));
  }, []);

  // Initialize selected keys with all items once cart is loaded
  useEffect(() => {
    if (isLoaded) {
      if (!initialized && items.length > 0) {
        setSelectedKeys(items.map((i) => getItemKey(i)));
        setInitialized(true);
      } else {
        // Prune any deleted items
        setSelectedKeys((prev) =>
          prev.filter((key) => items.some((i) => getItemKey(i) === key)),
        );
      }
    }
  }, [isLoaded, items, initialized, getItemKey]);

  const isAllSelected =
    items.length > 0 && items.every((i) => selectedKeys.includes(getItemKey(i)));

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(items.map((i) => getItemKey(i)));
    }
  };

  const toggleItem = (itemKey: string) => {
    setSelectedKeys((prev) =>
      prev.includes(itemKey)
        ? prev.filter((id) => id !== itemKey)
        : [...prev, itemKey],
    );
  };

  const toggleSeller = (sellerItems: typeof items) => {
    const sellerItemKeys = sellerItems.map((i) => getItemKey(i));
    const isSellerAll = sellerItemKeys.every((key) => selectedKeys.includes(key));
    if (isSellerAll) {
      setSelectedKeys((prev) =>
        prev.filter((key) => !sellerItemKeys.includes(key)),
      );
    } else {
      setSelectedKeys((prev) => Array.from(new Set([...prev, ...sellerItemKeys])));
    }
  };

  const selectedItems = items.filter((i) => selectedKeys.includes(getItemKey(i)));
  const selectedTotalAmount = selectedItems.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0,
  );
  const selectedTotalCount = selectedItems.reduce(
    (sum, i) => sum + i.quantity,
    0,
  );

  // Group selected by seller for checkout target
  const selectedSellerEntries = Object.entries(groupedBySeller).filter(
    ([, group]) =>
      group.items.some((i) => selectedKeys.includes(getItemKey(i))),
  );
  const firstSelectedSeller = selectedSellerEntries[0];
  const firstSelectedSellerId = firstSelectedSeller ? firstSelectedSeller[0] : "";
  const firstSelectedSellerItems = firstSelectedSeller
    ? firstSelectedSeller[1].items.filter((i) =>
        selectedKeys.includes(getItemKey(i)),
      )
    : [];
  const firstSelectedSlug = firstSelectedSellerItems[0]?.slug || "";
  const firstSelectedItemsParam = firstSelectedSellerItems
    .map((i) => i.listingId)
    .join(",");

  const mainBuyButtonText =
    firstSelectedSellerItems.length > 1
      ? `Beli (${firstSelectedSellerItems.length})`
      : "Beli";

  if (!isLoaded || isLoggedIn === null) {
    return (
      <div className="py-16 text-center">
        <PageContainer className="max-w-md mx-auto space-y-4">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-500">Memuat keranjang belanja...</p>
        </PageContainer>
      </div>
    );
  }

  if (isLoggedIn === false) {
    return (
      <div className="py-16 md:py-24 text-center">
        <PageContainer className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto text-primary-600">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold font-display text-neutral-900">
            Masuk untuk Mengakses Keranjang
          </h1>
          <p className="text-xs text-neutral-600 max-w-sm mx-auto leading-relaxed">
            Demi keamanan dan kemudahan transaksi Anda, silakan masuk ke akun Biji Hub untuk melihat dan mengelola keranjang belanja Anda.
          </p>
          <div className="pt-2">
            <Link
              href="/login?next=/cart"
              className={buttonVariants({
                className: "bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-6",
              })}
            >
              Masuk ke Akun
            </Link>
          </div>
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
              href="/"
              className={buttonVariants({
                className: "bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-6",
              })}
            >
              Jelajahi Pilihan Kopi
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

        {/* Tokopedia Select All Bar */}
        <div className="bg-white border border-neutral-300 rounded-lg p-3.5 flex items-center justify-between text-xs shadow-2xs">
          <label className="flex items-center gap-2.5 cursor-pointer font-medium text-neutral-800 select-none">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={toggleAll}
              className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span>
              Pilih Semua ({selectedItems.length}/{items.length} item dipilih)
            </span>
          </label>

          {selectedItems.length > 0 && (
            <button
              type="button"
              onClick={() => {
                selectedItems.forEach((i) => removeFromCart(i.listingId, i.grindSize));
              }}
              className="text-xs text-rose-600 hover:underline font-semibold"
            >
              Hapus yang Dipilih
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main List Grouped by Seller */}
          <div className="lg:col-span-8 space-y-6">
            {Object.keys(groupedBySeller).length > 1 && (
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5 shadow-2xs">
                <Store className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-blue-950">
                    Pesanan dari {Object.keys(groupedBySeller).length} Toko Berbeda
                  </p>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Karena setiap roastery mengirim dari kotanya masing-masing, pengiriman dan pembayaran diproses per toko. Selesaikan transaksi toko pertama, lalu lanjutkan untuk toko berikutnya.
                  </p>
                </div>
              </div>
            )}

            {Object.entries(groupedBySeller).map(([sellerId, group]) => {
              const sellerItemKeys = group.items.map((i) => getItemKey(i));
              const isSellerAll = sellerItemKeys.every((key) => selectedKeys.includes(key));
              const sellerSelected = group.items.filter((i) =>
                selectedKeys.includes(getItemKey(i)),
              );
              const sellerSelectedSubtotal = sellerSelected.reduce(
                (sum, i) => sum + i.price * i.quantity,
                0,
              );
              const firstSlug = group.items[0]?.slug;
              const sellerBuyText =
                sellerSelected.length > 1
                  ? `Beli (${sellerSelected.length})`
                  : "Beli";

              return (
                <div
                  key={sellerId}
                  className="bg-white border border-neutral-300 rounded-lg p-5 space-y-4 shadow-xs"
                >
                  {/* Seller Header with Checkbox */}
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSellerAll}
                        onChange={() => toggleSeller(group.items)}
                        className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        title="Pilih semua produk dari toko ini"
                      />
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

                  {/* Items list with Checkboxes */}
                  <div className="divide-y divide-neutral-100">
                    {group.items.map((item) => {
                      const itemKey = getItemKey(item);
                      const isItemChecked = selectedKeys.includes(itemKey);

                      return (
                        <div
                          key={itemKey}
                          className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={isItemChecked}
                              onChange={() => toggleItem(itemKey)}
                              className="w-4 h-4 mt-1 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 cursor-pointer shrink-0"
                            />
                            <div className="w-12 h-12 rounded bg-neutral-100 border border-neutral-200 relative overflow-hidden flex items-center justify-center text-neutral-400 shrink-0">
                              {item.imageUrl ? (
                                <Image
                                  src={item.imageUrl}
                                  alt={item.title}
                                  fill
                                  className="object-cover rounded"
                                  unoptimized
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
                              {item.grindSize && (
                                <span className="inline-block mt-1 text-[11px] font-medium bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded border border-neutral-200">
                                  Gilingan: {item.grindSize}
                                </span>
                              )}
                              <p className="text-neutral-500 mt-1">
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
                                  updateCartQuantity(
                                    item.listingId,
                                    item.quantity - 1,
                                    item.grindSize,
                                  )
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
                                  updateCartQuantity(
                                    item.listingId,
                                    item.quantity + 1,
                                    item.grindSize,
                                  )
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
                              onClick={() =>
                                removeFromCart(item.listingId, item.grindSize)
                              }
                              className="text-neutral-400 hover:text-rose-600 p-1"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Seller Checkout CTA */}
                  <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50/70 p-3 rounded">
                    <div>
                      <span className="text-[11px] text-neutral-500">
                        Subtotal ({sellerSelected.length} produk dipilih):
                      </span>
                      <p className="font-mono font-bold text-sm text-primary-900">
                        {formatRupiah(sellerSelectedSubtotal)}
                      </p>
                    </div>

                    {sellerSelected.length > 0 ? (
                      <Link
                        href={`/checkout/${firstSlug}?cart=1&sellerId=${sellerId}&items=${sellerSelected.map((i) => i.listingId).join(",")}`}
                        className={buttonVariants({
                          size: "sm",
                          className:
                            "bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-4 gap-1.5",
                        })}
                      >
                        <span>{sellerBuyText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <Button
                        size="sm"
                        disabled
                        className="bg-neutral-200 text-neutral-400 text-xs px-4 cursor-not-allowed"
                      >
                        Pilih Produk
                      </Button>
                    )}
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
                  <span>Total Produk ({selectedTotalCount} item)</span>
                  <span className="font-mono font-semibold text-neutral-900">
                    {formatRupiah(selectedTotalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-500 text-[11px]">
                  <span>Ongkos Kirim & Asuransi</span>
                  <span className="italic">Dihitung saat checkout</span>
                </div>

                <div className="pt-3 border-t border-neutral-200 flex justify-between items-baseline font-bold text-sm">
                  <span className="text-neutral-900">Total Estimasi</span>
                  <span className="font-mono text-primary-700 text-base">
                    {formatRupiah(selectedTotalAmount)}
                  </span>
                </div>

                <div className="pt-2 space-y-2">
                  {firstSelectedSellerItems.length > 0 ? (
                    <Link
                      href={`/checkout/${firstSelectedSlug}?cart=1&sellerId=${firstSelectedSellerId}&items=${firstSelectedItemsParam}`}
                      className={buttonVariants({
                        size: "lg",
                        className:
                          "w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 text-xs shadow-xs flex items-center justify-center gap-2",
                      })}
                    >
                      <span>{mainBuyButtonText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <Button
                      disabled
                      className="w-full bg-neutral-200 text-neutral-400 font-medium py-3 text-xs cursor-not-allowed"
                    >
                      Pilih Produk
                    </Button>
                  )}

                  {selectedSellerEntries.length > 1 && (
                    <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed space-y-0.5">
                      <p className="font-semibold">Perhatian Multi-Toko:</p>
                      <p className="text-[10px] text-amber-800">
                        Checkout saat ini untuk <strong>{firstSelectedSeller?.[1]?.sellerName}</strong>. Produk toko lain tetap tersimpan aman di keranjang.
                      </p>
                    </div>
                  )}

                  <Link
                    href="/"
                    className={buttonVariants({
                      variant: "outline",
                      className: "w-full text-xs text-neutral-700",
                    })}
                  >
                    Tambah Kopi Lainnya
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
