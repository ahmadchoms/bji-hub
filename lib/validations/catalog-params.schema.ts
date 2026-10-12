import { z } from "zod";

export const catalogParamsSchema = z.object({
  q: z.string().trim().max(100).default(""),
  kategori: z.string().trim().default(""),
  asal: z.string().trim().default(""),
  proses: z.string().trim().default(""),
  sangrai: z.string().trim().default(""),
  harga_min: z.coerce.number().int().nonnegative().optional(),
  harga_max: z.coerce.number().int().nonnegative().optional(),
  verified: z.preprocess((value) => value === true || value === "true", z.boolean()).default(false),
  urut: z.enum(["newest", "price_asc", "price_desc", "terbaru", "harga_terendah", "harga_tertinggi"]).optional(),
  halaman: z.coerce.number().int().min(1).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "terbaru", "harga_terendah", "harga_tertinggi"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
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
    rawSort === "terbaru" ? "newest" : rawSort;

  const rawPage = value("page") || value("halaman") || 1;

  const parsed = catalogParamsSchema.safeParse({
    q: value("q"),
    kategori: value("kategori"),
    asal: value("asal"),
    proses: value("proses"),
    sangrai: value("sangrai"),
    harga_min: value("harga_min"),
    harga_max: value("harga_max"),
    verified: value("verified"),
    sort: normalizedSort,
    page: rawPage,
    urut: normalizedSort,
    halaman: rawPage,
  });

  return parsed.success ? parsed.data : catalogParamsSchema.parse({});
}
