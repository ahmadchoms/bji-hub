"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Minus, Plus } from "lucide-react";
import { ListingWithRelations } from "@/types";
import { PriceText, formatRupiah } from "@/components/shared/price-text";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ProductShippingEstimator } from "@/components/product/product-shipping-estimator";
import { GRIND_SIZE_OPTIONS, GrindSize } from "@/lib/coffee-constants";
import { cn } from "@/lib/utils";

interface ProductPurchaseBoxProps {
  listing: ListingWithRelations;
}

export function ProductPurchaseBox({ listing }: ProductPurchaseBoxProps) {
  const isCoffeeBean =
    listing.category.slug !== "equipment" && listing.category.slug !== "green-beans";
  const isGreenBean = listing.category.slug === "green-beans";

  const [selectedGrind, setSelectedGrind] = useState<GrindSize>("Biji Utuh");
  const [quantity, setQuantity] = useState<number>(listing.minOrderQty || 1);

  const isOutOfStock = listing.stock === 0;
  const maxStock = listing.stock !== undefined ? listing.stock : 9999;

  const handleDecrease = () => {
    setQuantity((prev) => Math.max(listing.minOrderQty || 1, prev - 1));
  };

  const handleIncrease = () => {
    setQuantity((prev) => Math.min(maxStock, prev + 1));
  };

  const subtotal = Number(listing.price) * quantity;
  const directCheckoutUrl = `/checkout/${listing.slug}?grind=${encodeURIComponent(
    isCoffeeBean ? selectedGrind : "",
  )}&qty=${quantity}`;

  return (
    <div className="space-y-4">
      {/* Pricing Box */}
      <div className="p-4 bg-neutral-50 border border-neutral-300 rounded-sm">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
              Harga
            </p>
            <PriceText price={listing.price} unit={listing.unit} size="lg" />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
              Min. Order
            </p>
            <span className="font-mono text-sm font-bold text-neutral-900">
              {listing.minOrderQty} {listing.unit}
            </span>
          </div>
        </div>
      </div>

      {/* Urgency Stock Warning Banner */}
      {listing.stock !== undefined && listing.stock > 0 && listing.stock <= 5 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200/90 rounded-sm text-xs text-amber-900 font-medium">
          <span className="text-base">⚡</span>
          <div>
            <strong>Stok Terbatas:</strong> Tersisa hanya{" "}
            <strong>
              {listing.stock} {listing.unit}
            </strong>{" "}
            lagi dari lot ini!
          </div>
        </div>
      )}

      {/* Sold Out Banner */}
      {isOutOfStock && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-sm text-xs text-rose-900 font-medium">
          <span className="text-base">⚠️</span>
          <div>
            <strong>Stok Habis:</strong> Kuota lot ini telah habis terjual. Silakan gunakan opsi negosiasi atau minta sampel di bawah untuk batch berikutnya.
          </div>
        </div>
      )}

      {/* Option 1: Grind Size Selection (For Roasted Beans / Single Lot) */}
      {isCoffeeBean && !isOutOfStock && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-neutral-900">
              Pilihan Bentuk / Gilingan
            </label>
            <span className="text-[11px] text-neutral-500 font-mono">
              Diproses segar saat pesan
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {GRIND_SIZE_OPTIONS.map((opt) => {
              const isSelected = selectedGrind === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedGrind(opt.value)}
                  className={cn(
                    "p-2.5 text-left rounded border transition-all text-xs flex flex-col justify-between",
                    isSelected
                      ? "border-primary-600 bg-primary-50/70 text-primary-950 font-medium ring-1 ring-primary-600"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50",
                  )}
                >
                  <span className="font-semibold">{opt.value}</span>
                  <span className="text-[10px] text-neutral-500 mt-0.5 line-clamp-1">
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Green Bean Notice */}
      {isGreenBean && (
        <div className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-2 rounded">
          🌱 <strong>Biji Kopi Mentah (Green Bean):</strong> Biji belum disangrai, siap untuk di-roasting sesuai profil preferensi roastery Anda.
        </div>
      )}

      {/* Quantity Stepper & Subtotal */}
      {!isOutOfStock && (
        <div className="pt-2 flex items-center justify-between border-t border-neutral-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium text-neutral-700">Jumlah:</span>
            <div className="flex items-center border border-neutral-300 rounded overflow-hidden">
              <button
                type="button"
                onClick={handleDecrease}
                disabled={quantity <= (listing.minOrderQty || 1)}
                className="w-8 h-8 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 text-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Kurangi jumlah"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center font-mono font-bold text-neutral-900 text-xs">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrease}
                disabled={quantity >= maxStock}
                className="w-8 h-8 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 text-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Tambah jumlah"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-neutral-500">{listing.unit}</span>
          </div>

          <div className="text-right">
            <span className="text-neutral-500 text-[10px] block">Subtotal</span>
            <span className="font-mono font-bold text-sm text-primary-900">
              {formatRupiah(subtotal)}
            </span>
          </div>
        </div>
      )}

      {/* Primary Online Checkout & Cart CTAs */}
      <div className="space-y-2 pt-1">
        {isOutOfStock ? (
          <button
            disabled
            className="w-full bg-neutral-200 text-neutral-500 font-medium py-3 px-4 rounded-sm text-base cursor-not-allowed flex items-center justify-center border border-neutral-300"
          >
            Stok Habis Terjual
          </button>
        ) : (
          <>
            <Link
              href={directCheckoutUrl}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-sm text-base shadow-xs flex items-center justify-center transition-colors"
            >
              <ShieldCheck className="w-5 h-5 mr-2 text-primary-200" />
              Beli Langsung
            </Link>

            <AddToCartButton
              item={{
                listingId: listing.id,
                slug: listing.slug,
                title: listing.title,
                price: listing.price,
                unit: listing.unit,
                minOrderQty: listing.minOrderQty,
                quantity: quantity,
                imageUrl: listing.images?.[0]?.url,
                sellerId: listing.sellerId,
                sellerName: listing.seller.businessName,
                sellerCity: listing.seller.city,
                grindSize: isCoffeeBean ? selectedGrind : undefined,
              }}
              grindSize={isCoffeeBean ? selectedGrind : undefined}
              className="w-full justify-center h-11 text-sm font-medium"
            />
          </>
        )}
      </div>

      {/* Estimasi Ongkir Ringkas */}
      <ProductShippingEstimator
        originCity={listing.seller.city}
        originProvince={listing.seller.province}
      />
    </div>
  );
}
