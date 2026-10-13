import { describe, it, expect, beforeEach } from "vitest";

const storage: Record<string, string> = {};
if (typeof global.localStorage === "undefined" || !global.localStorage?.getItem) {
  // @ts-expect-error mock storage
  global.localStorage = {
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

// Window event mock
if (typeof global.window === "undefined") {
  // @ts-expect-error mock window
  global.window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

import {
  getStoredCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
} from "./cart";

describe("shopping cart helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("adds and aggregates items in the cart", () => {
    addToCart({
      listingId: "item-1",
      slug: "gayo-natural",
      title: "Aceh Gayo Natural",
      price: 120000,
      unit: "kg",
      minOrderQty: 1,
      quantity: 2,
      sellerId: "seller-1",
      sellerName: "Gayo Roastery",
      sellerCity: "Takengon",
    });

    let items = getStoredCart();
    expect(items.length).toBe(1);
    expect(items[0].quantity).toBe(2);

    addToCart({
      listingId: "item-1",
      slug: "gayo-natural",
      title: "Aceh Gayo Natural",
      price: 120000,
      unit: "kg",
      minOrderQty: 1,
      quantity: 3,
      sellerId: "seller-1",
      sellerName: "Gayo Roastery",
      sellerCity: "Takengon",
    });

    items = getStoredCart();
    expect(items.length).toBe(1);
    expect(items[0].quantity).toBe(5);
  });

  it("updates quantity and removes items", () => {
    addToCart({
      listingId: "item-2",
      slug: "ciwidey-wash",
      title: "Ciwidey Washed",
      price: 110000,
      unit: "kg",
      minOrderQty: 1,
      quantity: 1,
      sellerId: "seller-2",
      sellerName: "Preanger",
      sellerCity: "Bandung",
    });

    updateCartQuantity("item-2", 4);
    expect(getStoredCart()[0].quantity).toBe(4);

    removeFromCart("item-2");
    expect(getStoredCart().length).toBe(0);
  });

  it("clears cart completely", () => {
    addToCart({
      listingId: "item-3",
      slug: "toraja-sapan",
      title: "Toraja Sapan",
      price: 135000,
      unit: "kg",
      minOrderQty: 1,
      quantity: 1,
      sellerId: "seller-3",
      sellerName: "Toraja Mill",
      sellerCity: "Makale",
    });

    clearCart();
    expect(getStoredCart().length).toBe(0);
  });
});
