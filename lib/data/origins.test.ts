import { describe, expect, it } from "vitest";
import {
  getCoffeeOrigins,
  getCoffeeOriginById,
  createCoffeeOrigin,
  toggleCoffeeOriginStatus,
} from "./origins";

describe("Coffee Origins Data Module", { timeout: 15000 }, () => {
  it("returns pre-populated specialty coffee origins", async () => {
    const origins = await getCoffeeOrigins();
    expect(origins.length).toBeGreaterThan(5);

    const gayo = origins.find((o) => o.name === "Aceh Gayo");
    expect(gayo).toBeDefined();
    expect(gayo?.country).toBe("Indonesia");
    expect(gayo?.islandOrState).toBe("Sumatra");
    expect(gayo?.minAltitude).toBe(1200);

    const yirgacheffe = origins.find((o) => o.name === "Yirgacheffe");
    expect(yirgacheffe).toBeDefined();
    expect(yirgacheffe?.country).toBe("Ethiopia");
  });

  it("filters origins by domestic vs international", async () => {
    const domestic = await getCoffeeOrigins({ country: "Indonesia" });
    expect(domestic.every((o) => o.country === "Indonesia")).toBe(true);

    const intl = await getCoffeeOrigins({ country: "Colombia" });
    expect(intl.some((o) => o.name === "Huila")).toBe(true);
  });

  it("creates a new coffee origin and retrieves it", async () => {
    const created = await createCoffeeOrigin({
      name: "Sidikalang Test",
      country: "Indonesia",
      islandOrState: "Sumatra",
      minAltitude: 1100,
      maxAltitude: 1400,
      description: "Aroma cokelat karamel khas Dairi.",
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe("Sidikalang Test");
    expect(created.isActive).toBe(true);

    const fetched = await getCoffeeOriginById(created.id);
    expect(fetched?.name).toBe("Sidikalang Test");
  });

  it("toggles origin active status", async () => {
    const created = await createCoffeeOrigin({
      name: "Kayumas Test",
      country: "Indonesia",
      islandOrState: "Jawa Timur",
    });

    const toggled = await toggleCoffeeOriginStatus(created.id);
    expect(toggled?.isActive).toBe(false);

    const toggledBack = await toggleCoffeeOriginStatus(created.id);
    expect(toggledBack?.isActive).toBe(true);
  });
});
