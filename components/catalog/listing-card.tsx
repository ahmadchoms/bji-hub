import Link from "next/link";
import Image from "next/image";
import { ListingWithRelations } from "@/types";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/components/shared/price-text";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { formatEstimatedPrice } from "@/lib/i18n";
import { TrackVisible } from "../shared/track-visible";
import { CompareButton } from "./compare-button";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { RoastMeter } from "./roast-meter";

type Locale = "id" | "en";

interface ListingCardProps {
  listing: ListingWithRelations;
  priority?: boolean;
  className?: string;
  isAd?: boolean;
  locale?: Locale;
}

interface Copy {
  soldOut: string;
  sponsored: string;
  roast: string;
  cupping: string;
  lowStock: (count: number) => string;
  rating: (avg: string, count: number) => string;
}

const LOW_STOCK_THRESHOLD = 10;
const MIN_RATING_COUNT = 3;
const MAX_FLAVOR_NOTES = 3;

const COPY: Record<Locale, Copy> = {
  id: {
    soldOut: "Stok habis",
    sponsored: "Iklan",
    roast: "Sangrai",
    cupping: "Cupping",
    lowStock: (count) => `Sisa ${count}`,
    rating: (avg, count) => `Rating ${avg} dari ${count} ulasan`,
  },
  en: {
    soldOut: "Sold out",
    sponsored: "Sponsored",
    roast: "Roast",
    cupping: "Cupping",
    lowStock: (count) => `${count} left`,
    rating: (avg, count) => `Rated ${avg} from ${count} reviews`,
  },
};

function formatFlavorNotes(notes?: string | null): string {
  if (!notes) return "";
  return notes
    .split(/[,;·]/)
    .map((note) => note.trim())
    .filter(Boolean)
    .slice(0, MAX_FLAVOR_NOTES)
    .join(" · ");
}

export function ListingCard({
  listing,
  priority = false,
  className,
  isAd = false,
  locale = "id",
}: ListingCardProps) {
  const copy = COPY[locale];
  const taste = listing.tasteProfile;

  const title =
    locale === "en" && listing.titleEn ? listing.titleEn : listing.title;
  const image = listing.images[0]?.url;
  const origin = taste?.originRegion || listing.seller.city;
  const meta = [origin, taste?.processMethod].filter(Boolean).join(" · ");
  const flavorNotes = formatFlavorNotes(taste?.flavorNotes);

  const stock = listing.stock ?? 0;
  const isOutOfStock = stock === 0;
  const isLowStock = !isOutOfStock && stock <= LOW_STOCK_THRESHOLD;

  const ratingCount = listing.ratingCount ?? 0;
  const hasRating =
    ratingCount >= MIN_RATING_COUNT && Boolean(listing.ratingAvg);
  const ratingText = hasRating ? Number(listing.ratingAvg).toFixed(1) : "";

  const cuppingValue =
    taste?.cuppingScore != null ? Number(taste.cuppingScore) : null;
  const cuppingText =
    cuppingValue !== null && Number.isFinite(cuppingValue)
      ? cuppingValue.toFixed(1)
      : null;

  return (
    <li className={cn("group/item relative min-w-0", className)}>
      {isAd && <TrackVisible listingId={listing.id} type="impression" />}

      <div className="absolute right-2 top-2 z-20 flex flex-col gap-1.5">
        <WishlistButton listing={listing} variant="icon" />
        <div className="coarse:opacity-100 transition-opacity duration-200 md:opacity-0 md:group-hover/item:opacity-100 md:focus-within:opacity-100">
          <CompareButton listing={listing} variant="icon" />
        </div>
      </div>

      <Link
        href={`/product/${listing.slug}`}
        className="group block rounded-md outline-offset-4"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-secondary">
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
            <div className="flex h-full items-center justify-center p-6 text-center">
              <span className="font-display text-xl font-medium leading-tight text-primary-400">
                {origin}
              </span>
            </div>
          )}

          {isAd && !isOutOfStock && (
            <span className="absolute bottom-2 left-2 z-10 rounded-sm bg-background/90 px-2 py-0.5 text-xs font-medium uppercase tracking-[0.14em] text-foreground backdrop-blur-sm">
              {copy.sponsored}
            </span>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
              <span className="rounded-sm bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
                {copy.soldOut}
              </span>
            </div>
          )}
        </div>

        <div className="pt-3">
          {meta && (
            <p className="truncate text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {meta}
            </p>
          )}

          <h2 className="mt-1.5 line-clamp-2 min-h-10 font-display text-[15px] font-medium leading-[1.3] text-foreground decoration-1 underline-offset-4 group-hover:underline sm:min-h-11 sm:text-[17px]">
            {title}
          </h2>

          <p className="mt-1 min-h-5 truncate text-[13px] font-light text-muted-foreground">
            {flavorNotes}
          </p>

          {(taste?.roastLevel || cuppingText) && (
            <div className="mt-2.5 flex items-center justify-between gap-2">
              {taste?.roastLevel ? (
                <RoastMeter level={taste.roastLevel} label={copy.roast} />
              ) : (
                <span />
              )}
              {cuppingText && (
                <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                  {copy.cupping}{" "}
                  <span className="text-foreground">{cuppingText}</span>
                </span>
              )}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span
              className={cn(
                "text-base font-semibold tabular-nums",
                isOutOfStock
                  ? "text-muted-foreground line-through"
                  : "text-foreground",
              )}
            >
              {formatRupiah(listing.price)}
            </span>
            <span className="text-xs font-light text-muted-foreground">
              / {listing.unit}
            </span>
            {locale === "en" && !isOutOfStock && (
              <span className="text-xs font-light text-muted-foreground">
                ({formatEstimatedPrice(listing.price, "USD").estimatedText})
              </span>
            )}
            {isLowStock && (
              <span className="ml-auto text-xs font-medium text-text-warning">
                {copy.lowStock(stock)}
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs">
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <span className="truncate font-medium text-muted-foreground">
                {listing.seller.businessName}
              </span>
              {listing.seller.isVerified && (
                <VerifiedBadge
                  size="sm"
                  showLabel={false}
                  className="shrink-0"
                />
              )}
            </div>

            {hasRating && (
              <span
                className="shrink-0 font-semibold tabular-nums text-foreground"
                aria-label={copy.rating(ratingText, ratingCount)}
              >
                {ratingText}
                <span className="font-light text-muted-foreground">
                  {" "}
                  ({ratingCount})
                </span>
              </span>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
