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
  urut: z.enum(["terbaru", "harga_terendah", "harga_tertinggi"]).default("terbaru"),
  halaman: z.coerce.number().int().min(1).default(1),
});

export type CatalogParams = z.infer<typeof catalogParamsSchema>;

export function parseCatalogParams(params: Record<string, string | string[] | undefined>): CatalogParams {
  const value = (key: string) => {
    const item = params[key];
    return Array.isArray(item) ? item[0] : item;
  };

  const parsed = catalogParamsSchema.safeParse({
    q: value("q"),
    kategori: value("kategori"),
    asal: value("asal"),
    proses: value("proses"),
    sangrai: value("sangrai"),
    harga_min: value("harga_min"),
    harga_max: value("harga_max"),
    verified: value("verified"),
    urut: value("urut"),
    halaman: value("halaman"),
  });

  return parsed.success ? parsed.data : catalogParamsSchema.parse({});
}
