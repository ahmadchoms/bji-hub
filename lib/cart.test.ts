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

// Window event mock
if (typeof mockGlobal.window === "undefined") {
  mockGlobal.window = {
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

  it("handles items from multiple sellers correctly", () => {
    addToCart({
      listingId: "item-1",
      slug: "gayo",
      title: "Gayo",
      price: 100000,
      unit: "kg",
      minOrderQty: 1,
      quantity: 2,
      sellerId: "seller-1",
      sellerName: "Gayo Roastery",
      sellerCity: "Takengon",
    });
    addToCart({
      listingId: "item-2",
      slug: "gayo-peaberry",
      title: "Gayo Peaberry",
      price: 120000,
      unit: "kg",
      minOrderQty: 1,
      quantity: 1,
      sellerId: "seller-1",
      sellerName: "Gayo Roastery",
      sellerCity: "Takengon",
    });
    addToCart({
      listingId: "item-3",
      slug: "bali-kintamani",
      title: "Bali Kintamani",
      price: 110000,
      unit: "kg",
      minOrderQty: 1,
      quantity: 3,
      sellerId: "seller-2",
      sellerName: "Bali Farm",
      sellerCity: "Bangli",
    });

    const items = getStoredCart();
    expect(items.length).toBe(3);

    const seller1Items = items.filter((i) => i.sellerId === "seller-1");
    expect(seller1Items.length).toBe(2);
    expect(seller1Items.reduce((sum, i) => sum + i.quantity, 0)).toBe(3);
  });

  it("handles different grind sizes for the same listing as separate cart items", () => {
    addToCart({
      listingId: "item-gayo",
      slug: "gayo-natural",
      title: "Aceh Gayo Natural",
      price: 120000,
      unit: "kg",
      minOrderQty: 1,
      quantity: 1,
      sellerId: "seller-1",
      sellerName: "Gayo Roastery",
      sellerCity: "Takengon",
      grindSize: "Biji Utuh",
    });

    addToCart({
      listingId: "item-gayo",
      slug: "gayo-natural",
      title: "Aceh Gayo Natural",
      price: 120000,
      unit: "kg",
      minOrderQty: 1,
      quantity: 2,
      sellerId: "seller-1",
      sellerName: "Gayo Roastery",
      sellerCity: "Takengon",
      grindSize: "Giling Halus",
    });

    let items = getStoredCart();
    expect(items.length).toBe(2);
    expect(items.find((i) => i.grindSize === "Biji Utuh")?.quantity).toBe(1);
    expect(items.find((i) => i.grindSize === "Giling Halus")?.quantity).toBe(2);

    // Update quantity for only Giling Halus
    updateCartQuantity("item-gayo", 4, "Giling Halus");
    items = getStoredCart();
    expect(items.find((i) => i.grindSize === "Giling Halus")?.quantity).toBe(4);
    expect(items.find((i) => i.grindSize === "Biji Utuh")?.quantity).toBe(1);

    // Remove only Giling Halus
    removeFromCart("item-gayo", "Giling Halus");
    items = getStoredCart();
    expect(items.length).toBe(1);
    expect(items[0].grindSize).toBe("Biji Utuh");
  });
});
