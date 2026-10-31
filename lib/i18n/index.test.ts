import { describe, it, expect } from "vitest";
import {
  DICTIONARIES,
  t,
  formatEstimatedPrice,
  DEFAULT_CURRENCY_RATES,
} from "./index";

describe("lib/i18n (C5)", () => {
  it("ensures parity between ID and EN dictionary keys", () => {
    const idKeys = Object.keys(DICTIONARIES.id).sort();
    const enKeys = Object.keys(DICTIONARIES.en).sort();

    expect(idKeys).toEqual(enKeys);
    expect(idKeys.length).toBeGreaterThan(30);
  });

  it("translates keys accurately for both locales with fallback", () => {
    expect(t("nav.catalog", "id")).toBe("Katalog Kopi");
    expect(t("nav.catalog", "en")).toBe("Coffee Catalog");

    expect(t("product.addToCart", "id")).toBe("Tambah ke Keranjang");
    expect(t("product.addToCart", "en")).toBe("Add to Cart");

    expect(t("checkout.total", "id")).toBe("Total Pembayaran");
    expect(t("checkout.total", "en")).toBe("Total Amount");
  });

  it("formats estimated display price without altering underlying IDR", () => {
    const amount = 100000; // Rp 100.000
    const resUsd = formatEstimatedPrice(amount, "USD", DEFAULT_CURRENCY_RATES.USD);

    expect(resUsd.idrText).toBe("Rp 100.000");
    expect(resUsd.estimatedText).toBe("≈ $ 6.30");
    expect(resUsd.combinedText).toBe("Rp 100.000 (≈ $ 6.30)");
    expect(resUsd.disclaimer).toContain("ditagih dalam IDR");

    const resEur = formatEstimatedPrice(amount, "EUR", DEFAULT_CURRENCY_RATES.EUR);
    expect(resEur.estimatedText).toBe("≈ € 5.90");

    const resJpy = formatEstimatedPrice(amount, "JPY", DEFAULT_CURRENCY_RATES.JPY);
    expect(resJpy.estimatedText).toBe("≈ ¥ 950");
  });
});
