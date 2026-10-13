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

  it("caches provinces on repeated calls", async () => {
    const first = await fetchProvinces();
    const second = await fetchProvinces();
    expect(first).toBe(second);
  });
});
