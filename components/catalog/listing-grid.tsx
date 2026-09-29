import { ListingWithRelations } from "@/types";
import { ListingCard } from "./listing-card";
import { ListingCardSkeleton } from "./listing-card-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { cn } from "@/lib/utils";

interface ListingGridProps {
  listings?: ListingWithRelations[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  skeletonCount?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  className?: string;
}

export function ListingGrid({ listings = [], isLoading = false, isError = false, errorMessage, onRetry, skeletonCount = 8, emptyTitle, emptyDescription, emptyAction, className }: ListingGridProps) {
  if (isError) return <div className="py-8"><ErrorState title="Gagal memuat produk." message={errorMessage} onRetry={onRetry} /></div>;
  if (isLoading) return <ul className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4", className)}>{Array.from({ length: skeletonCount }).map((_, index) => <li key={index}><ListingCardSkeleton /></li>)}</ul>;
  if (!listings.length) return <div className="py-8"><EmptyState title={emptyTitle || "Tidak ada produk yang cocok."} description={emptyDescription || ""} action={emptyAction} /></div>;
  return <ul className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4", className)}>{listings.map((listing, index) => <ListingCard key={listing.id} listing={listing} priority={index < 4} />)}</ul>;
}
