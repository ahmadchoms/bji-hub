import { describe, it, expect } from "vitest";
import {
  extractFlavorTags,
  getFlavorTagLabel,
  getFlavorTagCategory,
  FLAVOR_WHEEL_CATEGORIES,
} from "./flavor-wheel";

describe("Flavor Wheel Normalization", () => {
  it("extracts and normalizes known Indonesian and English flavor keywords", () => {
    const rawNotes = "Jackfruit, Red Grape, Brown Sugar, Jasmine";
    const tags = extractFlavorTags(rawNotes);
    expect(tags).toContain("nangka");
    expect(tags).toContain("anggur");
    expect(tags).toContain("gula-aren");
    expect(tags).toContain("melati");
  });

  it("handles citrus, dark chocolate and tea notes", () => {
    const notes = "Jeruk Mandarin, Dark Chocolate, Black Tea";
    const tags = extractFlavorTags(notes);
    expect(tags).toContain("jeruk");
    expect(tags).toContain("cokelat");
    expect(tags).toContain("teh-hitam");
  });

  it("preserves unrecognized notes as fallback tags", () => {
    const notes = "Starfruit, Rambutan";
    const tags = extractFlavorTags(notes);
    expect(tags).toContain("starfruit");
    expect(tags).toContain("rambutan");
  });

  it("maps tags to readable labels and parent categories", () => {
    expect(getFlavorTagLabel("jeruk")).toBe("Jeruk / Sitrus");
    expect(getFlavorTagLabel("cokelat")).toBe("Cokelat Hitam (Dark Chocolate)");

    const cat = getFlavorTagCategory("jeruk");
    expect(cat).not.toBeNull();
    expect(cat?.id).toBe("buah");
    expect(cat?.name).toBe("Buah");
  });
});
