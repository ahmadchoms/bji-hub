"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { addToCart, type CartItem } from "@/lib/cart";
import { ShoppingCart, Check } from "lucide-react";
import { toast } from "sonner";
import { checkAuthAction } from "@/actions/auth.actions";

interface AddToCartButtonProps {
  item: Omit<CartItem, "quantity"> & { quantity?: number };
  grindSize?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "sm" | "md" | "lg";
  className?: string;
  showIcon?: boolean;
  label?: string;
  disabled?: boolean;
}

export function AddToCartButton({
  item,
  grindSize,
  variant = "outline",
  size = "md",
  className,
  showIcon = true,
  label = "Tambah ke Keranjang",
  disabled = false,
}: AddToCartButtonProps) {
  const [added, setAdded] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const isAuthed = await checkAuthAction();
    if (!isAuthed) {
      toast.error(
        "Silakan masuk (login) terlebih dahulu untuk menyimpan ke keranjang.",
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

    addToCart({
      ...item,
      grindSize: grindSize || item.grindSize,
      quantity: item.quantity || item.minOrderQty || 1,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Button
      type="button"
      variant={variant}
      disabled={disabled}
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
          <ShoppingCart className="w-4 h-4 mr-1.5 text-neutral-600" />
        )
      )}
      {added ? "Tersimpan di Keranjang" : label}
    </Button>
  );
}
