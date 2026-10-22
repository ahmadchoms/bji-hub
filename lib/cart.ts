"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

export interface CartItem {
  listingId: string;
  slug: string;
  title: string;
  price: number;
  unit: string;
  minOrderQty: number;
  quantity: number;
  imageUrl?: string;
  sellerId: string;
  sellerName: string;
  sellerCity: string;
  grindSize?: string;
}

export function getCartItemKey(item: { listingId: string; grindSize?: string }): string {
  return `${item.listingId}::${item.grindSize || "Biji Utuh"}`;
}

const CART_STORAGE_KEY = "biji_cart_items";

// Helpers
export function getStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    // ignore: localStorage might be unavailable or disabled in browser
    return [];
  }
}

function saveCart(items: CartItem[]): void {
  memoryCart = items;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("biji-cart-changed"));
  } catch {
    // ignore: localStorage read/write fallback
    // Ignore storage quota errors
  }
}

export function addToCart(item: CartItem): void {
  const current = getStoredCart();
  const targetGrind = item.grindSize || "Biji Utuh";
  const existingIndex = current.findIndex(
    (i) => i.listingId === item.listingId && (i.grindSize || "Biji Utuh") === targetGrind,
  );

  if (existingIndex > -1) {
    current[existingIndex].quantity += item.quantity;
  } else {
    current.push({ ...item, grindSize: targetGrind });
  }

  saveCart(current);
}

export function updateCartQuantity(
  listingId: string,
  quantity: number,
  grindSize?: string,
): void {
  const current = getStoredCart();
  const item = current.find(
    (i) =>
      i.listingId === listingId &&
      (grindSize === undefined || (i.grindSize || "Biji Utuh") === grindSize),
  );
  if (!item) return;

  if (quantity <= 0) {
    removeFromCart(listingId, grindSize);
    return;
  }

  item.quantity = Math.max(item.minOrderQty, quantity);
  saveCart(current);
}

export function removeFromCart(listingId: string, grindSize?: string): void {
  const current = getStoredCart().filter((i) => {
    if (grindSize !== undefined) {
      return !(i.listingId === listingId && (i.grindSize || "Biji Utuh") === grindSize);
    }
    return i.listingId !== listingId;
  });
  saveCart(current);
}

export function clearCart(): void {
  saveCart([]);
}

// React hook for components
const EMPTY_CART: CartItem[] = [];
let memoryCart: CartItem[] = EMPTY_CART;

if (typeof window !== "undefined") {
  memoryCart = getStoredCart();
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    memoryCart = getStoredCart();
    callback();
  };
  window.addEventListener("biji-cart-changed", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("biji-cart-changed", handler);
    window.removeEventListener("storage", handler);
  };
}

const getClientSnapshot = (): CartItem[] => memoryCart;
const getServerSnapshot = (): CartItem[] => EMPTY_CART;

export function useCart() {
  const [isClient, setIsClient] = useState(false);
  const items = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  const totalItems = isClient
    ? items.reduce((sum, item) => sum + item.quantity, 0)
    : 0;

  const totalAmount = isClient
    ? items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    : 0;

  // Group items by Seller (since shipping is roastery-specific)
  const groupedBySeller = isClient
    ? items.reduce<Record<string, { sellerName: string; sellerCity: string; items: CartItem[] }>>(
        (acc, item) => {
          if (!acc[item.sellerId]) {
            acc[item.sellerId] = {
              sellerName: item.sellerName,
              sellerCity: item.sellerCity,
              items: [],
            };
          }
          acc[item.sellerId].items.push(item);
          return acc;
        },
        {},
      )
    : {};

  return {
    isLoaded: isClient,
    items: isClient ? items : [],
    totalItems,
    totalAmount,
    groupedBySeller,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    getItemKey: getCartItemKey,
  };
}
