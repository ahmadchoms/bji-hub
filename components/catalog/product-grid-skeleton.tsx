import { ListingCardSkeleton } from "@/components/catalog/listing-card-skeleton";

export function ProductGridSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-label="Memuat produk">
      {Array.from({ length: 12 }).map((_, index) => <li key={index}><ListingCardSkeleton /></li>)}
    </ul>
  );
}
