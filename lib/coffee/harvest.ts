/**
 * Coffee harvest seasons and crop freshness helpers (D4 / #10).
 */

export interface HarvestSeasonInfo {
  isHarvestSeason: boolean;
  isMainHarvest: boolean;
  activeMonths: number[];
  badgeText: string | null;
}

/**
 * Checks whether the current month (1-12) falls within an origin's harvest or peak harvest months.
 */
export function getHarvestSeasonInfo(
  harvestMonths: number[] = [],
  mainHarvestMonths: number[] = [],
  currentMonth: number = new Date().getMonth() + 1
): HarvestSeasonInfo {
  const isMain = mainHarvestMonths.includes(currentMonth);
  const isAny = isMain || harvestMonths.includes(currentMonth);

  let badgeText: string | null = null;
  if (isMain) {
    badgeText = "Musim Panen Raya";
  } else if (isAny) {
    badgeText = "Sedang Musim Panen";
  }

  return {
    isHarvestSeason: isAny,
    isMainHarvest: isMain,
    activeMonths: Array.from(new Set([...harvestMonths, ...mainHarvestMonths])).sort(
      (a, b) => a - b
    ),
    badgeText,
  };
}

/**
 * Evaluates whether green/roasted coffee is New Crop or Past Crop.
 * If cropYear equals current year (or previous year if current month <= 4), it's "New Crop".
 * Otherwise it's tagged "Past Crop".
 */
export function getCropFreshnessLabel(
  cropYear: string | number | null | undefined,
  now: Date = new Date()
): {
  label: string;
  isNewCrop: boolean;
  variant: "new_crop" | "past_crop" | "standard";
} {
  if (!cropYear) {
    return { label: "", isNewCrop: false, variant: "standard" };
  }

  const parsedYear = Number(String(cropYear).match(/\d{4}/)?.[0]);
  if (!parsedYear || isNaN(parsedYear)) {
    return { label: String(cropYear), isNewCrop: false, variant: "standard" };
  }

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // New crop window considers late harvest cycles
  const isNew =
    parsedYear === currentYear ||
    (parsedYear === currentYear - 1 && currentMonth <= 4);

  if (isNew) {
    return {
      label: `New Crop ${parsedYear}`,
      isNewCrop: true,
      variant: "new_crop",
    };
  }

  return {
    label: `Past Crop (${parsedYear})`,
    isNewCrop: false,
    variant: "past_crop",
  };
}
