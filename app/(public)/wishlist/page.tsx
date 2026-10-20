"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useWishlist, type WishlistItem } from "@/lib/wishlist";
import { addToCart } from "@/lib/cart";
import { PageContainer } from "@/components/layout/page-container";
import { formatRupiah } from "@/components/shared/price-text";
import { Button, buttonVariants } from "@/components/ui/button";
import { Heart, Trash2, ArrowRight, Store, Coffee, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { checkAuthAction } from "@/actions/auth.actions";

export default function WishlistPage() {
  const { isLoaded, items, totalItems, removeFromWishlist, clearWishlist } =
    useWishlist();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuthAction().then((authed) => setIsLoggedIn(authed));
  }, []);

  const handleAddToCart = async (item: WishlistItem) => {
    const isAuthed = await checkAuthAction();
    if (!isAuthed) {
      toast.error(
        "Silakan masuk (login) terlebih dahulu untuk menyimpan ke keranjang.",
        {
          action: {
            label: "Masuk",
            onClick: () => {
              window.location.href = "/login?next=/wishlist";
            },
          },
        },
      );
      return;
    }

    addToCart({
      listingId: item.listingId,
      slug: item.slug,
      title: item.title,
      price: item.price,
      unit: item.unit,
      minOrderQty: item.minOrderQty || 1,
      quantity: item.minOrderQty || 1,
      imageUrl: item.imageUrl,
      sellerId: item.sellerId,
      sellerName: item.sellerName,
      sellerCity: item.sellerCity,
      grindSize: "Biji Utuh",
    });
    toast.success(`"${item.title}" ditambahkan ke keranjang!`);
  };

  if (!isLoaded || isLoggedIn === null) {
    return (
      <div className="py-12 bg-neutral-50/50 min-h-[70vh]">
        <PageContainer className="max-w-5xl mx-auto">
          <div className="h-64 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-neutral-500 font-mono">
              <span className="w-2 h-2 rounded-full bg-primary-600 animate-ping" />
              Memuat daftar favorit...
            </div>
          </div>
        </PageContainer>
      </div>
    );
  }

  if (isLoggedIn === false) {
    return (
      <div className="py-16 md:py-24 text-center">
        <PageContainer className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto text-rose-600">
            <Heart className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold font-display text-neutral-900">
            Masuk untuk Mengakses Favorit
          </h1>
          <p className="text-xs text-neutral-600 max-w-sm mx-auto leading-relaxed">
            Demi keamanan akun Anda, silakan masuk ke akun Biji Hub untuk menyimpan dan melihat koleksi kopi favorit Anda.
          </p>
          <div className="pt-2">
            <Link
              href="/login?next=/wishlist"
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

  return (
    <div className="py-8 md:py-12 bg-neutral-50/50 min-h-[75vh]">
      <PageContainer className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              <h1 className="text-2xl font-bold font-display text-neutral-900">
                Kopi Favorit Saya
              </h1>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Daftar biji kopi specialty dan green bean pilihan yang Anda simpan untuk dipesan nanti.
            </p>
          </div>

          {totalItems > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-neutral-500">
                {totalItems} produk tersimpan
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearWishlist}
                className="text-xs text-neutral-500 hover:text-rose-600 hover:bg-rose-50"
              >
                Kosongkan Semua
              </Button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {totalItems === 0 ? (
          <div className="py-16 text-center bg-white rounded-lg border border-neutral-200 shadow-2xs p-8 max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-500">
              <Heart className="w-8 h-8 stroke-1" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-neutral-900">
                Belum Ada Kopi yang Disimpan
              </h2>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                Tekan tombol ikon hati pada kartu produk kopi atau halaman detail untuk menyimpan biji kopi favorit Anda. Otomatis tersimpan dan tersinkronisasi di semua perangkat Anda saat login.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/"
                className={buttonVariants({
                  variant: "default",
                  size: "sm",
                  className: "inline-flex items-center gap-2",
                })}
              >
                <span>Jelajahi Katalog Kopi</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Grid of saved beans */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item.listingId}
                className="group bg-white rounded-md border border-neutral-200 hover:border-neutral-400 transition-all shadow-2xs flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Thumbnail */}
                  <Link
                    href={`/product/${item.slug}`}
                    className="relative block aspect-video w-full bg-neutral-100 overflow-hidden"
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-neutral-400 bg-neutral-100">
                        <Coffee className="w-8 h-8 stroke-1" />
                      </div>
                    )}
                  </Link>

                  {/* Body Content */}
                  <div className="p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                      <Store className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">
                        {item.sellerName} • {item.sellerCity}
                      </span>
                    </div>

                    <Link
                      href={`/product/${item.slug}`}
                      className="block font-semibold text-neutral-900 text-sm hover:text-primary-700 transition-colors line-clamp-1"
                    >
                      {item.title}
                    </Link>

                    {/* Tags / Origin */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-neutral-600">
                      {item.originRegion && (
                        <span className="bg-neutral-100 px-1.5 py-0.5 rounded font-medium">
                          {item.originRegion}
                        </span>
                      )}
                      {item.processMethod && (
                        <span className="bg-neutral-100 px-1.5 py-0.5 rounded font-medium">
                          {item.processMethod}
                        </span>
                      )}
                      {item.roastLevel && (
                        <span className="bg-neutral-100 px-1.5 py-0.5 rounded font-medium">
                          {item.roastLevel}
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="pt-1">
                      <span className="font-mono text-sm font-bold text-neutral-900">
                        {formatRupiah(item.price)}
                      </span>
                      <span className="text-xs text-neutral-500 font-mono">
                        {" "}
                        / {item.unit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-3 bg-neutral-50 border-t border-neutral-100 flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeFromWishlist(item.listingId)}
                    title="Hapus dari daftar favorit"
                    className="text-neutral-400 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddToCart(item)}
                    className="flex-1 text-xs h-8 text-neutral-700 hover:text-neutral-900 border-neutral-300 gap-1.5 px-2 font-medium"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 text-primary-600" />
                    <span>+ Keranjang</span>
                  </Button>

                  <Link
                    href={`/product/${item.slug}`}
                    className={buttonVariants({
                      variant: "default",
                      size: "sm",
                      className: "text-center justify-center text-xs h-8 px-2.5 shrink-0",
                    })}
                  >
                    <span>Pesan</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
