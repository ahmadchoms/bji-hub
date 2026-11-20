import { ListingCardSkeleton } from "@/components/catalog/listing-card-skeleton";

export function ProductGridSkeleton() {
  return (
    <ul className="columns-2 gap-3.5 md:columns-3 xl:columns-4 [column-fill:balance]" aria-label="Memuat produk">
      {Array.from({ length: 12 }).map((_, index) => <li key={index} className="mb-3.5 break-inside-avoid"><ListingCardSkeleton /></li>)}
    </ul>
  );
}
