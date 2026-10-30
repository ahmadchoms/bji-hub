import { describe, expect, it } from "vitest";
import { parseCatalogParams } from "./catalog-params.schema";

describe("catalog-params.schema", () => {
  it("parses modern English query parameters correctly", () => {
    const params = parseCatalogParams({
      category: "arabika",
      origin: "Aceh",
      process: "Natural",
      roast: "Medium",
      min_price: "50000",
      max_price: "200000",
      sort: "price_asc",
      page: "2",
      verified: "true",
      cupping_score: "85",
    });

    expect(params.category).toBe("arabika");
    expect(params.origin).toBe("Aceh");
    expect(params.process).toBe("Natural");
    expect(params.roast).toBe("Medium");
    expect(params.min_price).toBe(50000);
    expect(params.max_price).toBe(200000);
    expect(params.sort).toBe("price_asc");
    expect(params.page).toBe(2);
    expect(params.verified).toBe(true);
    expect(params.cupping_score).toBe(85);
  });

  it("parses ready_stock and stok_tersedia flags correctly", () => {
    const en = parseCatalogParams({ ready_stock: "true" });
    expect(en.ready_stock).toBe(true);

    const id = parseCatalogParams({ stok_tersedia: "true" });
    expect(id.ready_stock).toBe(true);
  });

  it("parses rasa and flavor parameter correctly", () => {
    const res = parseCatalogParams({ rasa: "jeruk,madu" });
    expect(res.rasa).toBe("jeruk,madu");

    const alias = parseCatalogParams({ flavor: "cokelat" });
    expect(alias.rasa).toBe("cokelat");
  });

  it("supports legacy Indonesian parameters for backward compatibility", () => {
    const params = parseCatalogParams({
      kategori: "robusta",
      asal: "Toraja",
      proses: "Washed",
      sangrai: "Dark",
      harga_min: "30000",
      harga_max: "150000",
      skor_cupping: "84",
      urut: "harga_tertinggi",
      halaman: "3",
    });

    expect(params.category).toBe("robusta");
    expect(params.origin).toBe("Toraja");
    expect(params.process).toBe("Washed");
    expect(params.roast).toBe("Dark");
    expect(params.min_price).toBe(30000);
    expect(params.max_price).toBe(150000);
    expect(params.cupping_score).toBe(84);
    expect(params.sort).toBe("price_desc");
    expect(params.page).toBe(3);
  });

  it("normalizes new sort options (freshest, cupping, rating, popular) (UX-2)", () => {
    expect(parseCatalogParams({ sort: "freshest" }).sort).toBe("freshest");
    expect(parseCatalogParams({ urut: "paling_segar" }).sort).toBe("freshest");
    expect(parseCatalogParams({ sort: "cupping_desc" }).sort).toBe("cupping_desc");
    expect(parseCatalogParams({ urut: "skor_cupping" }).sort).toBe("cupping_desc");
    expect(parseCatalogParams({ sort: "rating_desc" }).sort).toBe("rating_desc");
    expect(parseCatalogParams({ urut: "terlaris" }).sort).toBe("popular");
  });
});
