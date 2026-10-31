import type { ListingWithRelations } from "@/types";
import { tasteSimilarity, type TasteVector } from "./similarity";
import { getFreshness, daysSinceRoast, type RoastLevel } from "./freshness";
import { BREW_METHODS, type BrewMethodId } from "./brew-methods";

export interface CoffeeGuideCriteria {
  brewMethod: BrewMethodId;
  acidity: number; // 1 to 5
  sweetness: number; // 1 to 5
  body: number; // 1 to 5
  maxPrice?: number; // e.g. 150000 IDR
  freshnessPreference?: "ultra_fresh" | "optimal" | "any";
}

export interface CoffeeGuideRecommendation {
  listing: ListingWithRelations;
  score: number;
  reason: string;
  tasteMatchPct: number;
}

/**
 * Evaluates how well a roast level matches a chosen brewing method.
 */
export function getBrewMethodRoastMatch(
  roastLevel: string | undefined | null,
  method: BrewMethodId
): number {
  const norm = (roastLevel || "").toLowerCase();

  switch (method) {
    case "v60":
      if (norm.includes("light")) return 1.0;
      if (norm.includes("medium")) return 0.8;
      return 0.3;
    case "aeropress":
      if (norm.includes("medium") || norm.includes("light")) return 1.0;
      return 0.6;
    case "espresso":
      if (norm.includes("medium-dark") || norm.includes("dark")) return 1.0;
      if (norm.includes("medium")) return 0.7;
      return 0.2;
    case "moka_pot":
    case "vietnam_drip":
      if (norm.includes("medium-dark") || norm.includes("dark")) return 1.0;
      if (norm.includes("medium")) return 0.8;
      return 0.4;
    case "french_press":
    case "tubruk":
      if (norm.includes("medium")) return 1.0;
      if (norm.includes("dark") || norm.includes("light")) return 0.7;
      return 0.5;
    case "cold_brew":
      if (norm.includes("medium") || norm.includes("dark")) return 1.0;
      return 0.7;
    default:
      return 0.5;
  }
}

/**
 * Calculates budget suitability score between 0 and 1.
 */
export function getBudgetMatch(price: number, maxPrice?: number): number {
  if (!maxPrice || maxPrice <= 0) return 1.0;
  if (price <= maxPrice) return 1.0;
  if (price <= maxPrice * 1.25) return 0.5;
  return 0.1;
}

/**
 * Calculates freshness alignment score between 0 and 1.
 */
export function getFreshnessScore(
  roastDate: Date | string | null | undefined,
  roastLevel: string = "Medium",
  preference: "ultra_fresh" | "optimal" | "any" = "optimal",
  now: Date = new Date()
): number {
  const freshness = getFreshness(roastDate, roastLevel as RoastLevel, now);
  if (!freshness) {
    // If no roast date is provided, assign neutral baseline
    return 0.5;
  }

  const days = freshness.days;
  if (preference === "ultra_fresh") {
    if (days <= 7) return 1.0;
    if (days <= 14) return 0.7;
    return 0.3;
  }

  if (preference === "optimal") {
    if (freshness.state === "optimal") return 1.0;
    if (freshness.state === "good") return 0.7;
    if (freshness.state === "resting") return 0.6;
    return 0.2;
  }

  // Any active fresh coffee is acceptable
  if (freshness.state === "optimal" || freshness.state === "good") return 0.9;
  return 0.6;
}

/**
 * Pure scoring function for a single coffee candidate against guide criteria.
 * Formula: 0.5 * tasteSimilarity + 0.2 * brewMatch + 0.2 * budgetMatch + 0.1 * freshness
 */
export function scoreListingForGuide(
  listing: ListingWithRelations,
  criteria: CoffeeGuideCriteria,
  now: Date = new Date()
): {
  totalScore: number;
  tasteScore: number;
  brewMatch: number;
  budgetMatch: number;
  freshnessScore: number;
  reason: string;
} {
  const targetTaste: TasteVector = {
    acidityScore: criteria.acidity,
    sweetnessScore: criteria.sweetness,
    bodyScore: criteria.body,
  };

  const listingTaste: TasteVector = listing.tasteProfile
    ? {
        acidityScore: listing.tasteProfile.acidityScore,
        sweetnessScore: listing.tasteProfile.sweetnessScore,
        bodyScore: listing.tasteProfile.bodyScore,
      }
    : { acidityScore: 3, sweetnessScore: 3, bodyScore: 3 };

  const tasteScore = tasteSimilarity(targetTaste, listingTaste);
  const brewMatch = getBrewMethodRoastMatch(
    listing.tasteProfile?.roastLevel,
    criteria.brewMethod
  );
  const budgetMatch = getBudgetMatch(listing.price, criteria.maxPrice);
  const freshnessScore = getFreshnessScore(
    listing.tasteProfile?.roastDate,
    listing.tasteProfile?.roastLevel || "Medium",
    criteria.freshnessPreference || "optimal",
    now
  );

  const totalScore =
    0.5 * tasteScore +
    0.2 * brewMatch +
    0.2 * budgetMatch +
    0.1 * freshnessScore;

  // Build descriptive reason
  const methodName = BREW_METHODS[criteria.brewMethod]?.name || criteria.brewMethod;
  const reasons: string[] = [`Cocok untuk ${methodName}`];

  if (listing.tasteProfile?.flavorNotes) {
    const notesSummary = listing.tasteProfile.flavorNotes.split(",").slice(0, 2).map((s) => s.trim()).join(", ");
    reasons.push(`Notes: ${notesSummary}`);
  } else if (tasteScore >= 0.8) {
    reasons.push("Profil rasa sangat sesuai");
  }

  const days = daysSinceRoast(listing.tasteProfile?.roastDate, now);
  if (days !== null && days >= 0) {
    reasons.push(`Disangrai ${days} hari lalu`);
  } else {
    reasons.push("Stok siap kirim");
  }

  return {
    totalScore: Number(totalScore.toFixed(3)),
    tasteScore: Number(tasteScore.toFixed(3)),
    brewMatch: Number(brewMatch.toFixed(2)),
    budgetMatch: Number(budgetMatch.toFixed(2)),
    freshnessScore: Number(freshnessScore.toFixed(2)),
    reason: reasons.join(" • "),
  };
}

/**
 * Filters and ranks candidate listings using pure scoring formula.
 * Guarantees that out-of-stock and non-active items are never included.
 */
export function recommendCoffeeForGuide(
  candidates: ListingWithRelations[],
  criteria: CoffeeGuideCriteria,
  limit: number = 3,
  now: Date = new Date()
): CoffeeGuideRecommendation[] {
  // Must only recommend active products with available stock
  const eligible = candidates.filter(
    (item) => item.status === "active" && (item.stock ?? 0) > 0
  );

  const scored = eligible.map((listing) => {
    const result = scoreListingForGuide(listing, criteria, now);
    return {
      listing,
      score: result.totalScore,
      reason: result.reason,
      tasteMatchPct: Math.round(result.tasteScore * 100),
    };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Tie-break with rating or stock
    const bRating = b.listing.ratingAvg ?? 0;
    const aRating = a.listing.ratingAvg ?? 0;
    return bRating - aRating;
  });

  return scored.slice(0, limit);
}
