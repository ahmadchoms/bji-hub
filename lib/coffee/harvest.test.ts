import { describe, it, expect } from "vitest";
import { getHarvestSeasonInfo, getCropFreshnessLabel } from "./harvest";

describe("lib/coffee/harvest (D4)", () => {
  it("detects peak harvest and active harvest months", () => {
    // Months: 9 (September) to 12 (December)
    const harvestMonths = [9, 10, 11, 12];
    const mainHarvest = [10, 11];

    const oct = getHarvestSeasonInfo(harvestMonths, mainHarvest, 10);
    expect(oct.isHarvestSeason).toBe(true);
    expect(oct.isMainHarvest).toBe(true);
    expect(oct.badgeText).toBe("Musim Panen Raya");

    const dec = getHarvestSeasonInfo(harvestMonths, mainHarvest, 12);
    expect(dec.isHarvestSeason).toBe(true);
    expect(dec.isMainHarvest).toBe(false);
    expect(dec.badgeText).toBe("Sedang Musim Panen");

    const feb = getHarvestSeasonInfo(harvestMonths, mainHarvest, 2);
    expect(feb.isHarvestSeason).toBe(false);
    expect(feb.badgeText).toBeNull();
  });

  it("labels New Crop and Past Crop accurately", () => {
    const fixedNow = new Date("2026-10-31T00:00:00+07:00");

    const currentYearCrop = getCropFreshnessLabel(2026, fixedNow);
    expect(currentYearCrop.isNewCrop).toBe(true);
    expect(currentYearCrop.label).toBe("New Crop 2026");
    expect(currentYearCrop.variant).toBe("new_crop");

    const pastYearCrop = getCropFreshnessLabel(2024, fixedNow);
    expect(pastYearCrop.isNewCrop).toBe(false);
    expect(pastYearCrop.label).toBe("Past Crop (2024)");
    expect(pastYearCrop.variant).toBe("past_crop");
  });
});
