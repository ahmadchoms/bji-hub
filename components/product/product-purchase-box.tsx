"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Minus, Plus, Sparkles, X } from "lucide-react";
import { ListingWithRelations } from "@/types";
import { PriceText, formatRupiah } from "@/components/shared/price-text";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ProductShippingEstimator } from "@/components/product/product-shipping-estimator";
import { GRIND_OPTIONS } from "@/lib/coffee/brew-methods";
import { BrewCalculator } from "@/components/catalog/brew-calculator";

interface ProductPurchaseBoxProps {
  listing: ListingWithRelations;
}

export function ProductPurchaseBox({ listing }: ProductPurchaseBoxProps) {
  const isGreenBean = listing.category.slug === "green-beans";

  const [quantity, setQuantity] = useState<number>(listing.minOrderQty || 1);
  const [confirmedGreenBean, setConfirmedGreenBean] = useState(false);
  const [selectedGrind, setSelectedGrind] = useState<string>("Biji Utuh (Whole Bean)");
  const [showCalculator, setShowCalculator] = useState(false);

  const isOutOfStock = listing.stock === 0;
  const maxStock = listing.stock !== undefined ? listing.stock : 9999;

  const handleDecrease = () => {
    setQuantity((prev) => Math.max(listing.minOrderQty || 1, prev - 1));
  };

  const handleIncrease = () => {
    setQuantity((prev) => Math.min(maxStock, prev + 1));
  };

  const subtotal = Number(listing.price) * quantity;
  const directCheckoutUrl = `/checkout/${listing.slug}?qty=${quantity}${
    !isGreenBean && selectedGrind ? `&grind=${encodeURIComponent(selectedGrind)}` : ""
  }`;

  return (
    <div className="space-y-4">
      {/* Pricing Box */}
      <div className="p-4 bg-neutral-50 border border-neutral-300 rounded-sm">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest mb-1">
              Harga
            </p>
            <PriceText price={listing.price} unit={listing.unit} size="lg" />
          </div>
          <div className="text-right">
            <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest mb-1">
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

      {/* Green Bean Purchase Protection Notice & Confirmation */}
      {isGreenBean && (
        <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded text-xs space-y-2.5">
          <div className="flex items-start gap-2">
            <span className="text-base shrink-0">⚠️</span>
            <div className="space-y-1">
              <h4 className="font-bold text-amber-950">
                Perlindungan Pembelian: Biji Mentah (Green Bean)
              </h4>
              <p className="text-xs text-amber-900 leading-relaxed">
                Produk ini adalah <strong>Biji Kopi Mentah yang belum disangrai</strong>. Jangan dimasukkan langsung ke dalam mesin grinder seduh biasa karena biji masih sangat keras dan belum siap seduh. Khusus untuk kebutuhan sangrai roastery atau home-roaster.
              </p>
            </div>
          </div>

          <label className="flex items-start gap-2 pt-1 border-t border-amber-200/80 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmedGreenBean}
              onChange={(e) => setConfirmedGreenBean(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-amber-400 text-primary-600 focus:ring-primary-500 cursor-pointer"
            />
            <span className="text-xs font-medium text-amber-950">
              Saya mengonfirmasi bahwa saya memahami produk ini adalah biji kopi mentah belum disangrai.
            </span>
          </label>
        </div>
      )}

      {/* Grind Selector & Brew Method Matcher (COF-3) */}
      {!isGreenBean && !isOutOfStock && (
        <div className="space-y-2 pt-2 border-t border-neutral-200">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-neutral-800">
              Pilihan Bentuk & Gilingan:
            </label>
            <button
              type="button"
              onClick={() => setShowCalculator((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs text-primary-800 font-semibold hover:text-primary-900 hover:underline cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>{showCalculator ? "Tutup Panduan" : "Panduan & Kalkulator Seduh"}</span>
            </button>
          </div>

          <select
            value={selectedGrind}
            onChange={(e) => setSelectedGrind(e.target.value)}
            className="w-full h-9 px-3 rounded-sm border border-neutral-300 bg-white text-xs font-medium text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer"
          >
            {GRIND_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {showCalculator && (
            <div className="pt-2 animate-in fade-in-50">
              <BrewCalculator
                onSelectGrind={(grind) => {
                  setSelectedGrind(grind);
                  setShowCalculator(false);
                }}
              />
            </div>
          )}
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
            <span className="text-neutral-600">{listing.unit}</span>
          </div>

          <div className="text-right">
            <span className="text-neutral-600 text-xs block">Subtotal</span>
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
            className="w-full bg-neutral-200 text-neutral-600 font-medium py-3 px-4 rounded-sm text-base cursor-not-allowed flex items-center justify-center border border-neutral-300"
          >
            Stok Habis Terjual
          </button>
        ) : (
          <>
            {!isGreenBean || confirmedGreenBean ? (
              <Link
                href={directCheckoutUrl}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-sm text-base shadow-xs flex items-center justify-center transition-colors"
              >
                <ShieldCheck className="w-5 h-5 mr-2 text-primary-200" />
                Beli Langsung
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="w-full bg-neutral-200 text-neutral-400 font-medium py-3 px-4 rounded-sm text-base cursor-not-allowed flex items-center justify-center border border-neutral-300"
                title="Konfirmasi peringatan Green Bean di atas untuk melanjutkan pembelian"
              >
                <ShieldCheck className="w-5 h-5 mr-2 text-neutral-400" />
                Beli Langsung
              </button>
            )}

            <AddToCartButton
              item={{
                listingId: listing.id,
                slug: listing.slug,
                title: listing.title,
                price: listing.price,
                unit: listing.unit,
                minOrderQty: listing.minOrderQty,
                quantity: quantity,
                grindSize: isGreenBean ? undefined : selectedGrind,
                imageUrl: listing.images?.[0]?.url,
                sellerId: listing.sellerId,
                sellerName: listing.seller.businessName,
                sellerCity: listing.seller.city,
              }}
              disabled={isGreenBean && !confirmedGreenBean}
              className="w-full justify-center h-11 text-sm font-medium"
            />

            {isGreenBean && !confirmedGreenBean && (
              <p className="text-xs text-amber-800 text-center font-medium italic">
                Harap centang konfirmasi Green Bean di atas untuk melanjutkan pemesanan.
              </p>
            )}
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
