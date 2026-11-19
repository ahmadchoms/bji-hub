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
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      aria-label="Daftar produk kopi"
    >
      {items.map((item, index) => (
        <ListingCard
          key={item.listing.id}
          listing={item.listing}
          priority={index < 4}
          isAd={item.isAd}
          locale={locale}
        />
      ))}
    </ul>
  );
}
