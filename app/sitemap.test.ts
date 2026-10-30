import { describe, it, expect, vi } from "vitest";
import sitemap from "./sitemap";

vi.mock("@/lib/data", () => ({
  getListings: vi.fn().mockResolvedValue({
    items: [
      { slug: "gayo-natural-microlot", createdAt: "2025-01-01T00:00:00.000Z" },
    ],
  }),
  getSellers: vi.fn().mockResolvedValue([
    { slug: "roastery-nusantara", createdAt: "2025-01-01T00:00:00.000Z" },
  ]),
}));

vi.mock("@/lib/data/origins", () => ({
  getCoffeeOrigins: vi.fn().mockResolvedValue([
    { id: "origin-gayo", name: "Gayo", island: "Sumatera" },
  ]),
  toOriginSlug: vi.fn().mockReturnValue("gayo"),
}));

vi.mock("@/lib/data/producers", () => ({
  getProducers: vi.fn().mockResolvedValue([
    { slug: "koperasi-baburrayyan-gayo", createdAt: "2025-01-01T00:00:00.000Z" },
  ]),
}));

describe("Dynamic Sitemap (PERF-7)", () => {
  it("generates sitemap with static, product, store, origin, and producer URLs", async () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bijihub.com";
    const map = await sitemap();
    const urls = map.map((entry) => entry.url);

    // Static routes
    expect(urls).toContain(`${baseUrl}`);
    expect(urls).toContain(`${baseUrl}/asal-kopi`);
    expect(urls).toContain(`${baseUrl}/open-store`);
    expect(urls).toContain(`${baseUrl}/pricing`);
    expect(urls).toContain(`${baseUrl}/shipping-policy`);

    // Dynamic routes
    expect(urls).toContain(`${baseUrl}/product/gayo-natural-microlot`);
    expect(urls).toContain(`${baseUrl}/store/roastery-nusantara`);
    expect(urls).toContain(`${baseUrl}/asal-kopi/gayo`);
    expect(urls).toContain(`${baseUrl}/petani/koperasi-baburrayyan-gayo`);
  });
});
