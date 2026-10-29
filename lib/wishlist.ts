"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { ListingWithRelations } from "@/types";

export interface WishlistItem {
  listingId: string;
  slug: string;
  title: string;
  price: number;
  unit: string;
  imageUrl?: string;
  sellerId: string;
  sellerName: string;
  sellerCity: string;
  originRegion?: string;
  processMethod?: string;
  roastLevel?: string;
  minOrderQty?: number;
  stock?: number;
  addedAt: string;
}

const WISHLIST_STORAGE_KEY = "biji_wishlist_items";

export function getStoredWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    // ignore: localStorage wishlist read error
    return [];
  }
}

export async function syncWishlistWithCloud(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const { syncCloudWishlistAction } = await import("@/actions/wishlist.actions");
    const local = getStoredWishlist();
    const res = await syncCloudWishlistAction(local);
    if (res.success && res.data?.items) {
      const merged = res.data.items;
      if (JSON.stringify(merged) !== JSON.stringify(local)) {
        memoryWishlist = merged;
        try {
          localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(merged));
          window.dispatchEvent(new Event("biji-wishlist-changed"));
        } catch {
          // ignore: cookie JSON parsing error
        }
      }
    }
  } catch {
    // ignore: wishlist storage fallback
    // Graceful fallback for offline / mock testing
  }
}

function saveWishlist(items: WishlistItem[]): void {
  memoryWishlist = items;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("biji-wishlist-changed"));
    // ignore: non-blocking cloud wishlist sync
    syncWishlistWithCloud().catch(() => {});
  } catch {
    // ignore: wishlist storage fallback
    // Ignore storage quota errors
  }
}

export function addToWishlist(
  item: Omit<WishlistItem, "addedAt">,
): void {
  const current = getStoredWishlist();
  const exists = current.some((i) => i.listingId === item.listingId);
  if (!exists) {
    current.unshift({
      ...item,
      addedAt: new Date().toISOString(),
    });
    saveWishlist(current);
  }
}

export function removeFromWishlist(listingId: string): void {
  const current = getStoredWishlist().filter((i) => i.listingId !== listingId);
  saveWishlist(current);
}

export function toggleWishlist(
  item: Omit<WishlistItem, "addedAt">,
): boolean {
  const current = getStoredWishlist();
  const exists = current.some((i) => i.listingId === item.listingId);
  if (exists) {
    removeFromWishlist(item.listingId);
    return false;
  } else {
    addToWishlist(item);
    return true;
  }
}

export function isInWishlist(listingId: string): boolean {
  return getStoredWishlist().some((i) => i.listingId === listingId);
}

export function clearWishlist(): void {
  saveWishlist([]);
}

export function listingToWishlistItem(
  listing: ListingWithRelations,
): Omit<WishlistItem, "addedAt"> {
  return {
    listingId: listing.id,
    slug: listing.slug,
    title: listing.title,
    price: Number(listing.price),
    unit: listing.unit,
    imageUrl: listing.images?.[0]?.url,
    sellerId: listing.sellerId,
    sellerName: listing.seller.businessName,
    sellerCity: listing.seller.city,
    originRegion: listing.tasteProfile?.originRegion || listing.seller.city,
    processMethod: listing.tasteProfile?.processMethod,
    roastLevel: listing.tasteProfile?.roastLevel,
    minOrderQty: listing.minOrderQty,
    stock: listing.stock,
  };
}

const EMPTY_WISHLIST: WishlistItem[] = [];
let memoryWishlist: WishlistItem[] = EMPTY_WISHLIST;

if (typeof window !== "undefined") {
  memoryWishlist = getStoredWishlist();
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    memoryWishlist = getStoredWishlist();
    callback();
  };
  window.addEventListener("biji-wishlist-changed", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("biji-wishlist-changed", handler);
    window.removeEventListener("storage", handler);
  };
}

const getClientSnapshot = (): WishlistItem[] => memoryWishlist;
const getServerSnapshot = (): WishlistItem[] => EMPTY_WISHLIST;

export function useWishlist() {
  const [isClient, setIsClient] = useState(false);
  const items = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    setIsClient(true);
    // ignore: non-blocking cloud wishlist sync
    syncWishlistWithCloud().catch(() => {});
  }, []);

  const totalItems = isClient ? items.length : 0;

  const isSaved = (listingId: string) => {
    if (!isClient) return false;
    return items.some((i) => i.listingId === listingId);
  };

  return {
    isLoaded: isClient,
    items: isClient ? items : [],
    totalItems,
    isSaved,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    clearWishlist,
  };
}
