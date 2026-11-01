"use server";

import { getCatalogCached, normalizeFilters } from "@/lib/data/cached-catalog";
import {
  recommendCoffeeForGuide,
  type CoffeeGuideCriteria,
  type CoffeeGuideRecommendation,
} from "@/lib/coffee/guide";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { logger } from "@/lib/logger";

export async function getGuideRecommendationsAction(
  criteria: CoffeeGuideCriteria
): Promise<ActionResult<{ recommendations: CoffeeGuideRecommendation[] }>> {
  try {
    const { items } = await getCatalogCached(JSON.stringify(normalizeFilters({ pageSize: 100 })));
    const recommendations = recommendCoffeeForGuide(items, criteria, 3);
    return ok({ recommendations });
  } catch (err: unknown) {
    logger.error(
      "coffee_guide.recommendation_failed",
      err instanceof Error ? err : new Error(String(err))
    );
    return fail("Gagal memuat rekomendasi kopi");
  }
}
