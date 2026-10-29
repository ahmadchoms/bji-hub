import { describe, it, expect } from "vitest";
import {
  BREW_METHODS,
  GRIND_OPTIONS,
  getGrindForBrewMethod,
  calculateBrewRatio,
} from "./brew-methods";

describe("lib/coffee/brew-methods (COF-3)", () => {
  it("maps each brew method to a valid grind option", () => {
    for (const [key, method] of Object.entries(BREW_METHODS)) {
      expect(GRIND_OPTIONS).toContain(method.recommendedGrind);
      expect(getGrindForBrewMethod(key as keyof typeof BREW_METHODS)).toBe(
        method.recommendedGrind
      );
    }
  });

  it("calculates water requirement when coffee grams are input", () => {
    // 15g coffee with 1:16 ratio -> 240ml water
    const res = calculateBrewRatio({ coffeeGrams: 15, ratio: 16 });
    expect(res.coffeeGrams).toBe(15);
    expect(res.waterMl).toBe(240);
  });

  it("calculates coffee requirement when water volume is input", () => {
    // 300ml water with 1:15 ratio -> 20g coffee
    const res = calculateBrewRatio({ waterMl: 300, ratio: 15 });
    expect(res.coffeeGrams).toBe(20);
    expect(res.waterMl).toBe(300);
  });

  it("falls back to default 15g coffee if invalid/empty inputs given", () => {
    const res = calculateBrewRatio({ ratio: 16 });
    expect(res.coffeeGrams).toBe(15);
    expect(res.waterMl).toBe(240);
  });
});
