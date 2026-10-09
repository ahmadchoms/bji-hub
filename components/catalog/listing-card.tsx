import Link from "next/link";
import Image from "next/image";
import { ListingWithRelations } from "@/types";
import { cn } from "@/lib/utils";
import { TrackVisible } from "../shared/track-visible";
import { CompareButton } from "./compare-button";

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

  return (
    <li className={cn("relative min-w-0 group/item", className)}>
      {isAd && <TrackVisible listingId={listing.id} type="impression" />}
      <div className="absolute top-2 right-2 z-20">
        <CompareButton listing={listing} variant="icon" />
      </div>
      <Link
        href={`/product/${listing.slug}`}
        className="group block rounded-sm border border-neutral-300 bg-surface-base outline-none transition-colors hover:border-neutral-900 focus-visible:ring-2 focus-visible:ring-primary-600"
      >
        <div className="relative aspect-square overflow-hidden border-b border-neutral-300 bg-secondary-50">
          {isAd && (
            <span className="absolute top-2 left-2 z-10 text-[10px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-xs bg-amber-600 text-white shadow-xs">
              Iklan
            </span>
          )}
          {listing.minOrderQty >= 30 && !isAd && (
            <span className="absolute top-2 left-2 z-10 text-[10px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-xs bg-primary-900/90 text-white backdrop-blur-xs shadow-xs">
              Partai B2B
            </span>
          )}
          {image ? (
            <Image
              src={image}
              alt={listing.title}
              fill
              priority={priority}
              sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
              className="object-cover"
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
          <p className="truncate text-[11px] font-mono uppercase tracking-tight text-neutral-500">
            {origin} · {process} · {roast}
          </p>

          {listing.tasteProfile?.flavorNotes && (
            <p className="line-clamp-1 text-[11px] text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded-xs w-fit">
              <span className="font-medium text-neutral-500">Notes:</span>{" "}
              {listing.tasteProfile.flavorNotes}
            </p>
          )}

          <p className="font-mono text-base font-bold tabular-nums text-primary-900">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0,
            }).format(listing.price)}{" "}
            / {listing.unit}
          </p>
          {listing.minOrderQty > 1 && (
            <p className="text-[11px] font-mono text-neutral-500">
              Min. order {listing.minOrderQty} {listing.unit}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-xs text-neutral-600 truncate">
            <span className="truncate">{listing.seller.businessName}</span>
            {listing.seller.isVerified && (
              <span className="inline-block text-[10px] font-semibold text-accent-700 bg-accent-100 px-1 py-0.2 rounded-xs border border-accent-500/20 shrink-0">
                Terverifikasi
              </span>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
