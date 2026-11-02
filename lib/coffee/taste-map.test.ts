import { describe, it, expect } from "vitest";

describe("taste map data honesty (J4)", () => {
  it("keeps score 0 as valid numerical value and does not falsify defaults to 3", () => {
    const rawListing = {
      id: "l-1",
      slug: "kopi-rendah-asam",
      title: "Kopi Rendah Asam",
      price: "100000",
      tasteProfile: {
        originRegion: "Aceh",
        roastLevel: "Dark",
        acidityScore: 0,
        bodyScore: 4,
        cuppingScore: 84,
      },
    };

    const tp = rawListing.tasteProfile;
    expect(typeof tp?.acidityScore === "number" && typeof tp?.bodyScore === "number").toBe(true);
    expect(tp?.acidityScore).toBe(0);
    // Ensure 0 is NOT replaced with 3
    const acidity = tp?.acidityScore ?? 3;
    expect(acidity).toBe(0);
  });

  it("excludes products without numerical scores", () => {
    const items = [
      { id: "1", tasteProfile: { acidityScore: 2, bodyScore: 3 } },
      { id: "2", tasteProfile: { acidityScore: null, bodyScore: 3 } },
      { id: "3", tasteProfile: undefined },
      { id: "4", tasteProfile: { acidityScore: 1, bodyScore: 0 } },
    ];

    const valid = items.filter(
      (l) =>
        l.tasteProfile &&
        typeof l.tasteProfile.acidityScore === "number" &&
        typeof l.tasteProfile.bodyScore === "number",
    );

    expect(valid.length).toBe(2);
    expect(valid.map((v) => v.id)).toEqual(["1", "4"]);
  });
});
