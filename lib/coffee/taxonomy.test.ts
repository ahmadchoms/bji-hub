import { describe, it, expect } from "vitest";
import {
  COFFEE_VARIETIES,
  COFFEE_PROCESSES,
  COFFEE_CERTIFICATIONS,
  isProducerVerified,
  getVerifiedCertifications,
  formatAltitude,
  formatHarvestMonth,
} from "./taxonomy";

describe("Coffee Taxonomy", () => {
  it("defines standard Indonesian varieties and processes", () => {
    const varietyIds = COFFEE_VARIETIES.map((v) => v.id);
    expect(varietyIds).toContain("typica");
    expect(varietyIds).toContain("ateng");
    expect(varietyIds).toContain("s795");
    expect(varietyIds).toContain("sigarar_utang");

    const processIds = COFFEE_PROCESSES.map((p) => p.id);
    expect(processIds).toContain("giling_basah");
    expect(processIds).toContain("washed");
    expect(processIds).toContain("natural");

    const gilingBasah = COFFEE_PROCESSES.find((p) => p.id === "giling_basah");
    expect(gilingBasah?.isIndonesianHeritage).toBe(true);
  });

  it("checks producer verification and certifications strictly", () => {
    expect(isProducerVerified(null)).toBe(false);
    expect(isProducerVerified({ claimsVerifiedAt: null })).toBe(false);
    expect(
      isProducerVerified({ claimsVerifiedAt: "2026-05-01T00:00:00.000Z" })
    ).toBe(true);

    const unverifiedProducer = {
      certifications: ["indikasi-geografis", "organik-indonesia"],
      claimsVerifiedAt: null,
    };
    expect(getVerifiedCertifications(unverifiedProducer)).toEqual([]);

    const verifiedProducer = {
      certifications: ["indikasi-geografis", "organik-indonesia"],
      claimsVerifiedAt: "2026-05-01T00:00:00.000Z",
    };
    expect(getVerifiedCertifications(verifiedProducer)).toEqual([
      "indikasi-geografis",
      "organik-indonesia",
    ]);
  });

  it("formats altitude ranges and harvest months", () => {
    expect(formatAltitude(1200, 1600)).toBe("1.200 - 1.600 m dpl");
    expect(formatAltitude(1500, null)).toBe("1.500 m dpl");
    expect(formatAltitude(null, null)).toBeNull();

    expect(formatHarvestMonth(1)).toBe("Januari");
    expect(formatHarvestMonth(10)).toBe("Oktober");
    expect(formatHarvestMonth(12)).toBe("Desember");
    expect(formatHarvestMonth(13)).toBeNull();
    expect(formatHarvestMonth(null)).toBeNull();
  });
});
