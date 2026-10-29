"use client";

import { useCompare } from "@/context/compare-context";
import { ListingWithRelations } from "@/types";
import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompareButtonProps {
  listing: ListingWithRelations;
  className?: string;
  variant?: "icon" | "button";
}

export function CompareButton({
  listing,
  className,
  variant = "button",
}: CompareButtonProps) {
  const { isInCompare, addToCompare, removeFromCompare } = useCompare();
  const active = isInCompare(listing.id);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (active) {
      removeFromCompare(listing.id);
    } else {
      addToCompare(listing);
    }
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={active ? "Hapus dari perbandingan" : "Bandingkan lot ini"}
        className={cn(
          "size-7 coarse:size-11 rounded-sm flex items-center justify-center transition-colors text-xs font-mono",
          active
            ? "bg-neutral-900 text-white"
            : "bg-white/90 text-neutral-600 hover:text-neutral-900 hover:bg-white border border-neutral-200 shadow-2xs",
          className
        )}
      >
        <Scale className="size-3.5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "w-full h-10 px-4 rounded-sm border text-xs font-semibold transition-colors flex items-center justify-center gap-2",
        active
          ? "border-neutral-900 bg-neutral-900 text-white"
          : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50",
        className
      )}
    >
      <Scale className={cn("w-4 h-4 shrink-0", active ? "text-white" : "text-neutral-600")} />
      <span>{active ? "Ditambahkan ke Komparasi" : "Bandingkan Lot Kopi"}</span>
    </button>
  );
}
