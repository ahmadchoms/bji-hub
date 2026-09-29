import { cn } from "@/lib/utils";

export function ListingCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse overflow-hidden rounded-sm border border-neutral-300 bg-surface-base", className)}>
      <div className="aspect-square bg-neutral-200" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-full rounded-xs bg-neutral-200" />
        <div className="h-3 w-4/5 rounded-xs bg-neutral-200" />
        <div className="h-3 w-3/4 rounded-xs bg-neutral-200" />
        <div className="h-4 w-1/2 rounded-xs bg-neutral-200" />
        <div className="h-3 w-2/3 rounded-xs bg-neutral-200" />
      </div>
    </div>
  );
}
