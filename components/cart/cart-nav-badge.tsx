"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { ShoppingCart } from "lucide-react";

export function CartNavBadge() {
  const { totalItems, isLoaded } = useCart();

  return (
    <Link
      href="/cart"
      className="relative p-2 rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors flex items-center justify-center"
      title="Keranjang Belanja"
      aria-label="Keranjang Belanja"
    >
      <ShoppingCart className="w-4 h-4" />
      {isLoaded && totalItems > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-in zoom-in-50">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </Link>
  );
}
