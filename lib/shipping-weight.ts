export interface WeightItem {
  quantity: number;
  unit?: string | null;
}

/**
 * Computes total parcel weight in grams based on item quantities and units.
 * Standard domestic courier tariffs round up with a minimum of 1000 grams (1 kg).
 */
export function computeTotalWeightGrams(
  items?: WeightItem[] | null,
  fallbackQuantity = 1,
): number {
  if (!items || items.length === 0) {
    return Math.max(1000, fallbackQuantity * 1000);
  }

  let totalGrams = 0;
  for (const item of items) {
    const qty = Math.max(1, item.quantity || 1);
    const unit = (item.unit || "").toLowerCase().trim();

    if (unit.includes("kg")) {
      const match = unit.match(/([\d.]+)\s*kg/);
      const mult = match ? parseFloat(match[1]) : 1;
      totalGrams += qty * mult * 1000;
    } else if (unit.includes("g")) {
      const match = unit.match(/(\d+)\s*g/);
      const grams = match ? parseInt(match[1], 10) : 250;
      totalGrams += qty * grams;
    } else {
      // Default standard 1kg per item unit
      totalGrams += qty * 1000;
    }
  }

  return Math.max(1000, Math.ceil(totalGrams));
}
