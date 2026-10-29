"use client";

import Link from "next/link";
import { useWishlist } from "@/lib/wishlist";
import { Heart } from "lucide-react";

interface WishlistNavBadgeProps {
  showBadge?: boolean;
}

export function WishlistNavBadge({ showBadge = true }: WishlistNavBadgeProps) {
  const { totalItems, isLoaded } = useWishlist();

  return (
    <Link
      href="/wishlist"
      className="relative p-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors flex items-center justify-center"
      title="Kopi Favorit Saya"
      aria-label="Kopi Favorit Saya"
    >
      <Heart className="w-4 h-4" />
      {showBadge && isLoaded && totalItems > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 animate-in zoom-in-50">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </Link>
  );
}
