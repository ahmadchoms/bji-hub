import { describe, it, expect } from "vitest";
import { tasteSimilarity, findSimilarListings } from "./similarity";
import type { ListingWithRelations } from "@/types";

describe("tasteSimilarity", () => {
  it("computes cosine similarity between identical vectors as 1.0", () => {
    const a = { acidityScore: 4, bodyScore: 3, sweetnessScore: 4, aromaScore: 4, aftertasteScore: 3 };
    const b = { acidityScore: 4, bodyScore: 3, sweetnessScore: 4, aromaScore: 4, aftertasteScore: 3 };
    expect(tasteSimilarity(a, b)).toBeCloseTo(1.0, 5);
  });

  it("handles partial dimensions and null values gracefully", () => {
    const a = { acidityScore: 4, bodyScore: 2, sweetnessScore: null };
    const b = { acidityScore: 2, bodyScore: 1, sweetnessScore: undefined };
    // dot: 4*2 + 2*1 = 10
    // normA: 16 + 4 = 20, normB: 4 + 1 = 5
    // dot / sqrt(20 * 5) = 10 / 10 = 1.0
    expect(tasteSimilarity(a, b)).toBeCloseTo(1.0, 5);
  });

  it("returns 0 when vectors are orthogonal or all dimensions zero", () => {
    const a = { acidityScore: 0, bodyScore: 0 };
    const b = { acidityScore: 0, bodyScore: 0 };
    expect(tasteSimilarity(a, b)).toBe(0);
  });

  it("finds and sorts similar listings correctly", () => {
    const current = {
      id: "l1",
      slug: "gayo-fruity",
      status: "active",
      tasteProfile: {
        id: "tp1",
        listingId: "l1",
        originRegion: "Gayo",
        processMethod: "Natural",
        roastLevel: "Light",
        flavorNotes: "Berry, Peach",
        acidityScore: 4.5,
        bodyScore: 3.0,
        sweetnessScore: 4.0,
        aromaScore: 4.5,
        aftertasteScore: 4.0,
        roastDate: "2026-01-01",
      },
    } as unknown as ListingWithRelations;

    const similarCandidate = {
      id: "l2",
      slug: "bali-fruity",
      status: "active",
      tasteProfile: {
        id: "tp2",
        listingId: "l2",
        originRegion: "Kintamani",
        processMethod: "Natural",
        roastLevel: "Light",
        flavorNotes: "Citrus, Honey",
        acidityScore: 4.4,
        bodyScore: 3.2,
        sweetnessScore: 4.2,
        aromaScore: 4.4,
        aftertasteScore: 4.1,
        roastDate: "2026-01-01",
      },
    } as unknown as ListingWithRelations;

    const differentCandidate = {
      id: "l3",
      slug: "robusta-dark",
      status: "active",
      tasteProfile: {
        id: "tp3",
        listingId: "l3",
        originRegion: "Dampit",
        processMethod: "Natural",
        roastLevel: "Dark",
        flavorNotes: "Dark Chocolate, Earthy",
        acidityScore: 1.0,
        bodyScore: 5.0,
        sweetnessScore: 1.5,
        aromaScore: 2.0,
        aftertasteScore: 2.0,
        roastDate: "2026-01-01",
      },
    } as unknown as ListingWithRelations;

    const results = findSimilarListings(current, [differentCandidate, similarCandidate], 6);
    expect(results.length).toBe(2);
    expect(results[0]?.id).toBe("l2");
    expect(results[1]?.id).toBe("l3");
    expect(results[0]?.similarityScore).toBeGreaterThan(results[1]?.similarityScore || 0);
  });
});
