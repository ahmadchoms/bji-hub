import { ListingCard } from "@/components/catalog/listing-card";
import { FeedItem } from "@/types";

export function ProductList({
  items,
  locale = "id",
}: {
  items: FeedItem[];
  locale?: "id" | "en";
}) {
  return (
    <ul
      className="columns-2 gap-3.5 md:columns-3 xl:columns-3 [column-fill:balance]"
      aria-label="Daftar produk kopi"
    >
      {items.map((item, index) => (
        <ListingCard
          key={item.listing.id}
          listing={item.listing}
          priority={index < 4}
          isAd={item.isAd}
          locale={locale}
          className="mb-3 break-inside-avoid"
        />
      ))}
    </ul>
  );
}
