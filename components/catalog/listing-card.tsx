import Link from "next/link";
import Image from "next/image";
import { ListingWithRelations } from "@/types";
import { cn } from "@/lib/utils";

interface ListingCardProps {
  listing: ListingWithRelations;
  priority?: boolean;
  className?: string;
}

export function ListingCard({ listing, priority = false, className }: ListingCardProps) {
  const image = listing.images[0]?.url;
  const origin = listing.tasteProfile?.originRegion || listing.seller.city;
  const process = listing.tasteProfile?.processMethod || "—";
  const roast = listing.tasteProfile?.roastLevel || "—";
  const activeBoost = listing.isBoosted && Boolean(listing.boostUntil) && new Date(listing.boostUntil || 0).getTime() > Date.now();

  return (
    <li className={cn("min-w-0", className)}>
      <Link
        href={`/product/${listing.slug}`}
        className="group block rounded-sm border border-neutral-300 bg-surface-base outline-none transition-colors hover:border-neutral-900 focus-visible:ring-2 focus-visible:ring-primary-600"
      >
        <div className="relative aspect-square overflow-hidden border-b border-neutral-300 bg-secondary-50">
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
              <span className="font-display text-lg text-primary-900">{origin}</span>
            </div>
          )}
        </div>

        <div className="space-y-2 p-3">
          <h2 className="line-clamp-2 min-h-10 font-display text-base font-semibold leading-snug text-neutral-900 group-hover:underline">
            {listing.title}
          </h2>
          <p className="truncate text-[11px] font-mono uppercase tracking-tight text-neutral-500">
            {origin} · {process} · {roast}{activeBoost ? " · Iklan" : ""}
          </p>
          <p className="font-mono text-base font-bold tabular-nums text-primary-900">
            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(listing.price)} / {listing.unit}
          </p>
          {listing.minOrderQty > 1 && (
            <p className="text-[11px] text-neutral-500">Min. order {listing.minOrderQty} {listing.unit}</p>
          )}
          <p className="truncate text-xs text-neutral-600">
            {listing.seller.businessName}{listing.seller.isVerified ? " · Terverifikasi" : ""}
          </p>
        </div>
      </Link>
    </li>
  );
}
