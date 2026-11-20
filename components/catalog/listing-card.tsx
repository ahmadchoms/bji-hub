import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { ListingWithRelations } from "@/types";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/components/shared/price-text";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { formatEstimatedPrice } from "@/lib/i18n";
import { TrackVisible } from "../shared/track-visible";
import { CompareButton } from "./compare-button";
import { WishlistButton } from "@/components/wishlist/wishlist-button";

interface ListingCardProps {
  listing: ListingWithRelations;
  priority?: boolean;
  className?: string;
  isAd?: boolean;
  locale?: "id" | "en";
}

export function ListingCard({
  listing,
  priority = false,
  className,
  isAd = false,
  locale = "id",
}: ListingCardProps) {
  const title = locale === "en" && listing.titleEn ? listing.titleEn : listing.title;
  const image = listing.images[0]?.url;
  const origin = listing.tasteProfile?.originRegion || listing.seller.city;
  const process = listing.tasteProfile?.processMethod;
  const cuppingScore = listing.tasteProfile?.cuppingScore ? Number(listing.tasteProfile.cuppingScore) : null;
  const flavorNotes = listing.tasteProfile?.flavorNotes;
  const stock = listing.stock ?? 0;
  const isOutOfStock = stock === 0;
  const isLowStock = !isOutOfStock && stock <= 10;

  return (
    <li className={cn("relative min-w-0 group/item mb-3.5 break-inside-avoid", className)}>
      {isAd && <TrackVisible listingId={listing.id} type="impression" />}
      <div className="absolute top-2 right-2 z-20 flex flex-col gap-1.5">
        <WishlistButton listing={listing} variant="icon" />
        <div className="coarse:opacity-100 transition-opacity duration-200 md:opacity-0 md:group-hover/item:opacity-100 md:focus-within:opacity-100">
          <CompareButton listing={listing} variant="icon" />
        </div>
      </div>
      <Link
        href={`/product/${listing.slug}`}
        className="group block rounded-md border border-neutral-200 bg-surface-base outline-none transition-all duration-200 hover:border-neutral-900 hover:shadow-xs focus-visible:ring-2 focus-visible:ring-primary-600"
      >
        <div className="relative aspect-square overflow-hidden rounded-t-md border-b border-neutral-200 bg-secondary-50">
          {image ? (
            <Image
              src={image}
              alt={title}
              fill
              priority={priority}
              sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
              className={cn(
                "object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]",
                isOutOfStock && "opacity-60 grayscale",
              )}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center">
              <span className="text-lg text-primary-900 font-semibold">{origin}</span>
            </div>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 bg-neutral-950/50 backdrop-blur-[1px] flex items-center justify-center z-10">
              <span className="bg-neutral-900/90 text-white text-xs font-semibold px-2.5 py-1 rounded shadow-md border border-neutral-700 uppercase tracking-wider">
                {locale === "en" ? "Sold Out" : "Stok Habis"}
              </span>
            </div>
          )}
          {isAd && !isOutOfStock && (
            <span className="absolute top-2 left-2 z-10 text-xs font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-xs bg-amber-600 text-white shadow-xs">
              {locale === "en" ? "Sponsored" : "Iklan"}
            </span>
          )}
        </div>

        <div className="space-y-2 p-3">
          <h2 className="line-clamp-2 min-h-10 text-sm font-semibold leading-snug text-neutral-900 group-hover:underline">
            {title}
          </h2>

          <div className="flex flex-wrap items-center gap-1 text-xs">
            <span className="bg-neutral-100 text-neutral-800 px-1.5 py-0.5 rounded font-medium truncate max-w-[120px]">
              {origin}
            </span>
            {process && (
              <span className="bg-secondary-50 text-secondary-800 border border-secondary-200/60 px-1.5 py-0.5 rounded font-medium">
                {process}
              </span>
            )}
            {cuppingScore && (
              <span className="bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                Q {cuppingScore.toFixed(1)}
              </span>
            )}
          </div>

          {flavorNotes && (
            <p className="text-xs text-neutral-600 line-clamp-1 italic">
              {flavorNotes}
            </p>
          )}

          <div className="pt-1">
            {isOutOfStock ? (
              <div className="flex items-center justify-between">
                <p className="font-sans text-base font-bold tabular-nums text-neutral-400 line-through">
                  {formatRupiah(listing.price)}
                </p>
                <span className="text-xs font-sans font-semibold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded">
                  {locale === "en" ? "Sold Out" : "Habis"}
                </span>
              </div>
            ) : (
              <div className="flex items-baseline justify-between">
                <p className="font-sans text-base font-bold tabular-nums text-primary-950">
                  {formatRupiah(listing.price)}
                  {locale === "en" && (
                    <span className="text-xs text-neutral-600 font-normal ml-1">
                      ({formatEstimatedPrice(listing.price, "USD").estimatedText})
                    </span>
                  )}
                  <span className="text-xs font-normal text-neutral-600"> / {listing.unit}</span>
                </p>
                {isLowStock && (
                  <span className="text-xs font-medium text-amber-700">
                    Sisa {stock}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-1.5 text-xs text-neutral-600 pt-2 border-t border-neutral-100">
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <span className="truncate font-medium">{listing.seller.businessName}</span>
              {listing.seller.isVerified && (
                <VerifiedBadge size="sm" showLabel={false} className="shrink-0" />
              )}
            </div>

            {listing.ratingCount && listing.ratingCount >= 3 && listing.ratingAvg ? (
              <div className="flex items-center gap-1 font-semibold text-neutral-800 shrink-0">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" aria-hidden="true" />
                <span>{listing.ratingAvg.toFixed(1)}</span>
                <span className="text-neutral-600 font-normal">({listing.ratingCount})</span>
              </div>
            ) : null}
          </div>
        </div>
      </Link>
    </li>
  );
}
