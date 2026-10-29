import Link from "next/link";
import Image from "next/image";
import { ListingWithRelations } from "@/types";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/components/shared/price-text";
import { TrackVisible } from "../shared/track-visible";
import { CompareButton } from "./compare-button";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { FreshnessBadge } from "@/components/catalog/freshness-badge";

interface ListingCardProps {
  listing: ListingWithRelations;
  priority?: boolean;
  className?: string;
  isAd?: boolean;
}

export function ListingCard({
  listing,
  priority = false,
  className,
  isAd = false,
}: ListingCardProps) {
  const image = listing.images[0]?.url;
  const origin = listing.tasteProfile?.originRegion || listing.seller.city;
  const process = listing.tasteProfile?.processMethod || "—";
  const roast = listing.tasteProfile?.roastLevel || "—";
  const isOutOfStock = listing.stock === 0;
  const isLowStock =
    listing.stock !== undefined && listing.stock > 0 && listing.stock <= 5;
  const roastDate = listing.tasteProfile?.roastDate
    ? new Date(listing.tasteProfile.roastDate)
    : null;
  const daysSinceRoast =
    roastDate && !isNaN(roastDate.getTime())
      ? Math.floor((Date.now() - roastDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;
  const isGreenBean =
    listing.category?.slug === "green-beans" ||
    roast.toLowerCase().includes("green");

  return (
    <li className={cn("relative min-w-0 group/item", className)}>
      {isAd && <TrackVisible listingId={listing.id} type="impression" />}
      <div className="absolute top-2 right-2 z-20 flex flex-col gap-1.5">
        <WishlistButton listing={listing} variant="icon" />
        <CompareButton listing={listing} variant="icon" />
      </div>
      <Link
        href={`/product/${listing.slug}`}
        className="group block rounded-sm border border-neutral-300 bg-surface-base outline-none transition-colors hover:border-neutral-900 focus-visible:ring-2 focus-visible:ring-primary-600"
      >
        <div className="relative aspect-square overflow-hidden border-b border-neutral-300 bg-secondary-50">
          {isOutOfStock && (
            <div className="absolute inset-0 bg-neutral-950/50 backdrop-blur-[1px] flex items-center justify-center z-10">
              <span className="bg-neutral-900/90 text-white font-mono text-xs font-bold px-3 py-1 rounded shadow-md border border-neutral-700 uppercase tracking-wider">
                Stok Habis
              </span>
            </div>
          )}
          {isAd && !isOutOfStock && (
            <span className="absolute top-2 left-2 z-10 text-xs font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-xs bg-amber-600 text-white shadow-xs">
              Iklan
            </span>
          )}
          {listing.minOrderQty >= 30 && !isAd && !isOutOfStock && (
            <span className="absolute top-2 left-2 z-10 text-xs font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-xs bg-primary-900/90 text-white backdrop-blur-xs shadow-xs">
              Partai B2B
            </span>
          )}
          {daysSinceRoast !== null &&
            daysSinceRoast >= 0 &&
            daysSinceRoast <= 14 &&
            !isOutOfStock &&
            !isAd &&
            listing.minOrderQty < 30 && (
              <span className="absolute top-2 left-2 z-10 text-xs font-mono font-semibold px-1.5 py-0.5 rounded-xs bg-emerald-700 text-white shadow-xs">
                Fresh Roast
              </span>
            )}
          {isLowStock && !isOutOfStock && (
            <span className="absolute bottom-2 left-2 z-10 text-xs font-mono font-bold px-1.5 py-0.5 rounded-xs bg-amber-500 text-white shadow-xs">
              Sisa {listing.stock} {listing.unit}
            </span>
          )}
          {image ? (
            <Image
              src={image}
              alt={listing.title}
              fill
              priority={priority}
              sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
              className={cn(
                "object-cover transition-transform group-hover:scale-105 duration-300",
                isOutOfStock && "grayscale contrast-75 opacity-70",
              )}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center">
              <span className="font-display text-lg text-primary-900">
                {origin}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2 p-3">
          <h2 className="line-clamp-2 min-h-10 font-display text-base font-semibold leading-snug text-neutral-900 group-hover:underline">
            {listing.title}
          </h2>
          <div className="flex flex-wrap items-center gap-1 text-xs font-mono">
            <span className="bg-neutral-100 text-neutral-800 px-1.5 py-0.5 rounded font-medium truncate max-w-[120px]">
              {origin}
            </span>
            <span className="bg-secondary-50 text-secondary-800 border border-secondary-200/60 px-1.5 py-0.5 rounded font-medium">
              {process}
            </span>
            <span className="bg-amber-50 text-amber-800 border border-amber-200/60 px-1.5 py-0.5 rounded font-medium">
              {roast}
            </span>
            {listing.tasteProfile?.roastDate ? (
              <FreshnessBadge
                compact
                roastDate={listing.tasteProfile.roastDate}
                roastLevel={listing.tasteProfile.roastLevel}
              />
            ) : isGreenBean ? (
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-1.5 py-0.5 rounded font-medium">
                Mentah
              </span>
            ) : null}
            {listing.tasteProfile?.cuppingScore && (
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-300/70 px-1.5 py-0.5 rounded font-semibold">
                SCA {listing.tasteProfile.cuppingScore}
              </span>
            )}
          </div>

          {listing.tasteProfile?.flavorNotes && (
            <p className="line-clamp-1 text-xs text-neutral-600 bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-200 w-fit">
              <span className="font-semibold text-neutral-600">Notes:</span>{" "}
              {listing.tasteProfile.flavorNotes}
            </p>
          )}

          {isOutOfStock ? (
            <div className="flex items-center justify-between">
              <p className="font-mono text-base font-bold tabular-nums text-neutral-400 line-through">
                {formatRupiah(listing.price)}
              </p>
              <span className="text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded font-mono">
                Habis
              </span>
            </div>
          ) : (
            <p className="font-mono text-base font-bold tabular-nums text-primary-900">
              {formatRupiah(listing.price)} / {listing.unit}
            </p>
          )}
          {listing.minOrderQty > 1 && (
            <p className="text-xs font-mono text-neutral-600">
              Min. order {listing.minOrderQty} {listing.unit}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-xs text-neutral-600 truncate">
            <span className="truncate">{listing.seller.businessName}</span>
            {listing.seller.isVerified && (
              <span className="inline-block text-xs font-semibold text-accent-700 bg-accent-100 px-1 py-0.2 rounded-xs border border-accent-500/20 shrink-0">
                Terverifikasi
              </span>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
