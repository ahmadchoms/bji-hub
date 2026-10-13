"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { addToCart, type CartItem } from "@/lib/cart";
import { ShoppingCart, Check } from "lucide-react";
import { toast } from "sonner";

interface AddToCartButtonProps {
  item: Omit<CartItem, "quantity"> & { quantity?: number };
  variant?: "default" | "outline" | "secondary";
  size?: "sm" | "md" | "lg";
  className?: string;
  showIcon?: boolean;
  label?: string;
}

export function AddToCartButton({
  item,
  variant = "outline",
  size = "md",
  className,
  showIcon = true,
  label = "Tambah ke Keranjang",
}: AddToCartButtonProps) {
  const [added, setAdded] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart({
      ...item,
      quantity: item.quantity || item.minOrderQty || 1,
    });

    setAdded(true);
    toast.success(`"${item.title}" ditambahkan ke keranjang belanja`);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size === "md" ? "default" : size}
      onClick={handleClick}
      className={`transition-all duration-200 ${
        added
          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
          : "text-neutral-800 border-neutral-300 hover:border-neutral-400"
      } ${className || ""}`}
    >
      {showIcon && (
        added ? (
          <Check className="w-4 h-4 mr-1.5 text-emerald-600" />
        ) : (
          <ShoppingCart className="w-4 h-4 mr-1.5 text-neutral-500" />
        )
      )}
      {added ? "Tersimpan di Keranjang" : label}
    </Button>
  );
}
