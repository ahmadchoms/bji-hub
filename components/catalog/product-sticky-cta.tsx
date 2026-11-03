"use client";

import Link from "next/link";
import { ShieldCheck, MessageCircle } from "lucide-react";
import { ListingWithRelations } from "@/types";
import { formatRupiah } from "@/lib/utils";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { WaitlistButton } from "@/components/catalog/waitlist-button";
import { buildWhatsAppUrl } from "@/components/shared/whatsapp-button";
import { trackEvent } from "@/lib/tracking";

interface ProductStickyCTAProps {
  listing: ListingWithRelations;
}

export function ProductStickyCTA({ listing }: ProductStickyCTAProps) {
  const isOutOfStock = listing.stock === 0;
  const checkoutUrl = `/checkout/${listing.slug}?qty=${listing.minOrderQty || 1}`;

  const whatsappUrl = buildWhatsAppUrl({
    phoneNumber: listing.seller.whatsappNumber || "",
    listingId: listing.id,
    listingTitle: listing.title,
    sellerName: listing.seller.businessName,
  });

  return (
    <div
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-300 px-3.5 py-2.5 shadow-lg pb-[calc(0.6rem+env(safe-area-inset-bottom,0px))]"
      aria-label="Aksi Cepat Pembelian"
    >
      <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
        {/* Info Harga Ringkas & Jelas */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-base font-bold text-primary-900 tracking-tight leading-none">
              {formatRupiah(listing.price)}
            </span>
            {listing.unit && (
              <span className="text-xs text-neutral-600 font-sans">
                /{listing.unit}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-600 truncate mt-0.5">
            {listing.stock !== undefined && listing.stock > 0 && listing.stock <= 5 ? (
              <span className="text-amber-800 font-medium">
                Sisa {listing.stock} {listing.unit}
              </span>
            ) : (
              <span>
                Min. {listing.minOrderQty || 1} {listing.unit} • {listing.seller.city}
              </span>
            )}
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-1.5 shrink-0">
          {listing.seller.whatsappNumber && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent(listing.id, "contact_click")}
              className="inline-flex items-center justify-center size-10 min-w-[40px] min-h-[40px] coarse:size-11 rounded-sm border border-neutral-300 bg-white text-emerald-700 hover:bg-emerald-50 transition-colors shrink-0"
              title="Hubungi Penjual via WhatsApp"
              aria-label="Hubungi Penjual via WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          )}

          {isOutOfStock ? (
            <div className="w-32 sm:w-36">
              <WaitlistButton
                listingId={listing.id}
                nextRoastDate={listing.nextRoastDate}
              />
            </div>
          ) : (
            <>
              <AddToCartButton
                item={{
                  listingId: listing.id,
                  slug: listing.slug,
                  title: listing.title,
                  price: listing.price,
                  unit: listing.unit,
                  minOrderQty: listing.minOrderQty,
                  quantity: listing.minOrderQty || 1,
                  imageUrl: listing.images?.[0]?.url,
                  sellerId: listing.sellerId,
                  sellerName: listing.seller.businessName,
                  sellerCity: listing.seller.city,
                }}
                iconOnly
                className="size-10 min-w-[40px] min-h-[40px] coarse:size-11 p-0 rounded-sm shrink-0"
              />
              <Link
                href={checkoutUrl}
                className="inline-flex items-center justify-center h-10 min-h-[40px] coarse:h-11 coarse:min-h-11 px-3 sm:px-4 rounded-sm bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 whitespace-nowrap"
              >
                <ShieldCheck className="w-4 h-4 mr-1 text-primary-200" />
                Beli
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
