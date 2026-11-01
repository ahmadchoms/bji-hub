import { describe, it, expect } from "vitest";
import { getLotCuppingData } from "./lots";

describe("lib/data/lots.ts - Coffee Lot & Cupping Card Data (H1)", () => {
  it("returns null for invalid lot codes (length / characters)", async () => {
    expect(await getLotCuppingData("ab")).toBeNull();
    expect(await getLotCuppingData("INVALID LOT CODE WITH SPACES!")).toBeNull();
    expect(await getLotCuppingData("<script>alert(1)</script>")).toBeNull();
  });

  it("returns null for non-existent lot codes without falling back to demo data", async () => {
    const result = await getLotCuppingData("LOT-NONEXISTENT-9999");
    expect(result).toBeNull();
  });

  it("returns cupping data for valid lot code in mock dataset", async () => {
    // In mock dataset, KBQB-GAYO-2025-04 exists
    const result = await getLotCuppingData("KBQB-GAYO-2025-04");
    if (process.env.DATA_SOURCE === "mock") {
      expect(result).not.toBeNull();
      expect(result?.lot_code).toBe("KBQB-GAYO-2025-04");
      expect(result?.listing_id).toBeDefined();
      expect(result?.listing_title).toBeDefined();
    }
  });
});
