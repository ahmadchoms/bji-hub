"use client";

import { Heart } from "lucide-react";
import { useWishlist, listingToWishlistItem } from "@/lib/wishlist";
import type { ListingWithRelations } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { checkAuthAction } from "@/actions/auth.actions";

interface WishlistButtonProps {
  listing: ListingWithRelations;
  variant?: "icon" | "button";
  className?: string;
}

export function WishlistButton({
  listing,
  variant = "button",
  className,
}: WishlistButtonProps) {
  const { isSaved, toggleWishlist, isLoaded } = useWishlist();
  const saved = isLoaded && isSaved(listing.id);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const isAuthed = await checkAuthAction();
    if (!isAuthed) {
      toast.error(
        "Silakan masuk (login) terlebih dahulu untuk menyimpan ke daftar favorit.",
        {
          action: {
            label: "Masuk",
            onClick: () => {
              const current =
                typeof window !== "undefined" ? window.location.pathname : "/";
              window.location.href = `/login?next=${encodeURIComponent(current)}`;
            },
          },
        },
      );
      return;
    }

    toggleWishlist(listingToWishlistItem(listing));
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        aria-label={saved ? "Hapus dari favorit" : "Simpan ke favorit"}
        title={saved ? "Hapus dari kopi favorit" : "Simpan ke kopi favorit"}
        className={cn(
          "size-7 rounded-sm flex items-center justify-center transition-all duration-150 text-xs",
          saved
            ? "bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs"
            : "bg-white/90 text-neutral-500 hover:text-rose-600 hover:bg-white border border-neutral-200 shadow-2xs",
          className,
        )}
      >
        <Heart
          className={cn(
            "size-3.5 transition-transform duration-150",
            saved ? "fill-rose-500 text-rose-500 scale-110" : "",
          )}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={cn(
        "h-10 px-4 rounded-sm border text-xs font-semibold transition-all flex items-center justify-center gap-2",
        saved
          ? "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100/70"
          : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900",
        className,
      )}
    >
      <Heart
        className={cn(
          "size-4",
          saved ? "fill-rose-500 text-rose-500" : "text-neutral-500",
        )}
      />
      <span>{saved ? "Tersimpan di Favorit" : "Simpan Favorit"}</span>
    </button>
  );
}
