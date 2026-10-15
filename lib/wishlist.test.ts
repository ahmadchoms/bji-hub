import { describe, it, expect, beforeEach } from "vitest";

interface GlobalWithMock {
  localStorage?: Storage;
  window?: unknown;
}
const mockGlobal = globalThis as unknown as GlobalWithMock;

const storage: Record<string, string> = {};

if (typeof mockGlobal.localStorage === "undefined" || !mockGlobal.localStorage?.getItem) {
  mockGlobal.localStorage = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, val: string) => {
      storage[key] = val;
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      Object.keys(storage).forEach((k) => delete storage[k]);
    },
    length: 0,
    key: () => null,
  };
}

if (typeof mockGlobal.window === "undefined") {
  mockGlobal.window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

import {
  getStoredWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  isInWishlist,
  clearWishlist,
} from "./wishlist";

describe("Wishlist Helper Functions", () => {
  beforeEach(() => {
    mockGlobal.localStorage?.clear();
    clearWishlist();
  });

  const dummyItem = {
    listingId: "lot-1",
    slug: "gayo-bourbon",
    title: "Gayo Bourbon Anaerobic",
    price: 135000,
    unit: "250g",
    sellerId: "seller-1",
    sellerName: "Koperasi Gayo",
    sellerCity: "Takengon",
  };

  it("adds and retrieves items from wishlist", () => {
    expect(getStoredWishlist()).toHaveLength(0);
    addToWishlist(dummyItem);
    const items = getStoredWishlist();
    expect(items).toHaveLength(1);
    expect(items[0].listingId).toBe("lot-1");
    expect(isInWishlist("lot-1")).toBe(true);
    expect(isInWishlist("lot-2")).toBe(false);
  });

  it("prevents duplicate additions of the same listing", () => {
    addToWishlist(dummyItem);
    addToWishlist(dummyItem);
    expect(getStoredWishlist()).toHaveLength(1);
  });

  it("removes items from wishlist", () => {
    addToWishlist(dummyItem);
    expect(isInWishlist("lot-1")).toBe(true);
    removeFromWishlist("lot-1");
    expect(isInWishlist("lot-1")).toBe(false);
    expect(getStoredWishlist()).toHaveLength(0);
  });

  it("toggles item membership properly", () => {
    const added = toggleWishlist(dummyItem);
    expect(added).toBe(true);
    expect(isInWishlist("lot-1")).toBe(true);

    const removed = toggleWishlist(dummyItem);
    expect(removed).toBe(false);
    expect(isInWishlist("lot-1")).toBe(false);
  });
});
