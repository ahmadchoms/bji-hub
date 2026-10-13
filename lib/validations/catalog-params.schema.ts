import { z } from "zod";

export const catalogParamsSchema = z.object({
  q: z.string().trim().max(100).default(""),
  category: z.string().trim().default(""),
  origin: z.string().trim().default(""),
  process: z.string().trim().default(""),
  roast: z.string().trim().default(""),
  min_price: z.coerce.number().int().nonnegative().optional(),
  max_price: z.coerce.number().int().nonnegative().optional(),
  verified: z.preprocess((value) => value === true || value === "true", z.boolean()).default(false),
  sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  cupping_score: z.coerce.number().min(0).max(100).optional(),
  // Backward compatibility aliases
  min_cupping: z.coerce.number().min(0).max(100).optional(),
  skor_cupping: z.coerce.number().min(0).max(100).optional(),
  kategori: z.string().trim().optional(),
  asal: z.string().trim().optional(),
  proses: z.string().trim().optional(),
  sangrai: z.string().trim().optional(),
  harga_min: z.coerce.number().int().nonnegative().optional(),
  harga_max: z.coerce.number().int().nonnegative().optional(),
  urut: z.string().optional(),
  halaman: z.coerce.number().int().min(1).optional(),
});

export type CatalogParams = z.infer<typeof catalogParamsSchema>;

export function parseCatalogParams(params: Record<string, string | string[] | undefined>): CatalogParams {
  const value = (key: string) => {
    const item = params[key];
    return Array.isArray(item) ? item[0] : item;
  };

  const rawSort = value("sort") || value("urut") || "newest";
  const normalizedSort =
    rawSort === "harga_terendah" ? "price_asc" :
    rawSort === "harga_tertinggi" ? "price_desc" :
    rawSort === "terbaru" ? "newest" :
    (rawSort === "price_asc" || rawSort === "price_desc" ? rawSort : "newest");

  const page = Math.max(1, Number(value("page") || value("halaman")) || 1);
  const category = value("category") || value("kategori") || "";
  const origin = value("origin") || value("asal") || "";
  const processMethod = value("process") || value("proses") || "";
  const roast = value("roast") || value("sangrai") || "";
  const minPrice = value("min_price") || value("harga_min");
  const maxPrice = value("max_price") || value("harga_max");
  const cuppingScore = value("cupping_score") || value("min_cupping") || value("skor_cupping");
  const verified = value("verified") === "true";

  const parsed = catalogParamsSchema.safeParse({
    q: value("q") || "",
    category,
    origin,
    process: processMethod,
    roast,
    min_price: minPrice,
    max_price: maxPrice,
    cupping_score: cuppingScore,
    verified,
    sort: normalizedSort,
    page,
    kategori: category,
    asal: origin,
    proses: processMethod,
    sangrai: roast,
    harga_min: minPrice,
    harga_max: maxPrice,
    min_cupping: cuppingScore,
    skor_cupping: cuppingScore,
    urut: normalizedSort,
    halaman: page,
  });

  return parsed.success ? parsed.data : catalogParamsSchema.parse({});
}
