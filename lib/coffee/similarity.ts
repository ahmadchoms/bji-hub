import type { ListingWithRelations } from "@/types";

export const DIMENSIONS = [
  "acidityScore",
  "bodyScore",
  "sweetnessScore",
  "aromaScore",
  "aftertasteScore",
] as const;

export type TasteDimension = (typeof DIMENSIONS)[number];

export type TasteVector = Partial<
  Record<TasteDimension, number | null | undefined>
>;

/**
 * Calculates cosine similarity between two taste profile vectors.
 * Returns a value between 0.0 and 1.0 (or 0 if insufficient non-zero dimensions).
 */
export function tasteSimilarity(a: TasteVector, b: TasteVector): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const key of DIMENSIONS) {
    const x = a[key];
    const y = b[key];
    if (typeof x !== "number" || typeof y !== "number") continue;
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  return normA === 0 || normB === 0 ? 0 : dot / Math.sqrt(normA * normB);
}

/**
 * Finds up to `limit` most similar listings based on taste profile vector cosine similarity.
 * Evaluates candidate listings (max 200) and sorts by similarity score.
 */
export function findSimilarListings(
  current: ListingWithRelations,
  candidates: ListingWithRelations[],
  limit = 6
): Array<ListingWithRelations & { similarityScore?: number }> {
  const currentTaste = current.tasteProfile;
  if (!currentTaste) {
    return candidates
      .filter((item) => item.id !== current.id && item.status === "active")
      .slice(0, limit);
  }

  const pool = candidates
    .filter(
      (item) =>
        item.id !== current.id &&
        item.status === "active" &&
        Boolean(item.tasteProfile)
    )
    .slice(0, 200);

  const scored = pool.map((item) => {
    const candidateTaste = item.tasteProfile!;
    const similarity = tasteSimilarity(currentTaste, candidateTaste);

    // Boost similarity slightly if same processMethod or roastLevel
    let finalScore = similarity;
    if (candidateTaste.processMethod === currentTaste.processMethod) {
      finalScore += 0.05;
    }
    if (candidateTaste.roastLevel === currentTaste.roastLevel) {
      finalScore += 0.03;
    }

    return {
      item,
      score: Math.min(1, finalScore),
    };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const bRating = b.item.ratingAvg ?? 0;
    const aRating = a.item.ratingAvg ?? 0;
    return bRating - aRating;
  });

  return scored.slice(0, limit).map((s) => ({
    ...s.item,
    similarityScore: Number(s.score.toFixed(2)),
  }));
}
