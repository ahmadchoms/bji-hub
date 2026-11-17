import { describe, expect, it } from "vitest";
import { fetchProvinces, fetchRegencies } from "@/lib/regions";

describe("lib/regions", () => {
  it("fetches provinces and returns non-empty list with id and name", async () => {
    const provinces = await fetchProvinces();
    expect(Array.isArray(provinces)).toBe(true);
    expect(provinces.length).toBeGreaterThanOrEqual(34);
    expect(provinces[0]).toHaveProperty("id");
    expect(provinces[0]).toHaveProperty("name");
  });

  it("handles empty provinceId gracefully for regencies", async () => {
    const regencies = await fetchRegencies("");
    expect(regencies).toEqual([]);
  });

  it("fetches regencies by province id and by province name", async () => {
    const regenciesById = await fetchRegencies("32");
    expect(regenciesById.length).toBeGreaterThan(0);
    expect(regenciesById.some((r) => r.name.toLowerCase().includes("bandung"))).toBe(true);

    const regenciesByName = await fetchRegencies("Jawa Barat");
    expect(regenciesByName.length).toBe(regenciesById.length);

    const aceh = await fetchRegencies("Aceh");
    expect(aceh.length).toBeGreaterThan(0);
  });

  it("caches provinces on repeated calls", async () => {
    const first = await fetchProvinces();
    const second = await fetchProvinces();
    expect(first).toBe(second);
  });
});
