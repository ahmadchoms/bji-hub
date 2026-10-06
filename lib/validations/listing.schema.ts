import { z } from "zod";
import { IMAGE_RULES } from "../storage";

export const listingImageSchema = z.object({
  url: z.string().min(1).max(500),
  path: z.string().min(1).max(200),
});

const listingBaseSchema = z.object({
  title: z
    .string()
    .min(5, "Judul produk minimal 5 karakter")
    .max(120, "Judul produk maksimal 120 karakter"),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  description: z
    .string()
    .min(20, "Deskripsi produk minimal 20 karakter")
    .max(2000, "Deskripsi maksimal 2.000 karakter"),
  price: z
    .number({ message: "Harga wajib diisi" })
    .min(1000, "Harga minimal Rp1.000")
    .max(100_000_000, "Harga maksimal Rp100.000.000"),
  unit: z.string().min(1, "Satuan wajib diisi (misal: kg, 250g, box)"),
  minOrderQty: z
    .number({ message: "Jumlah minimum order wajib diisi" })
    .min(1, "Minimum order minimal 1"),
  status: z.enum(["active", "draft", "archived"], {
    message: "Status listing tidak valid",
  }),
  originRegion: z.string().min(1, "Daerah asal wajib diisi"),
  processMethod: z.enum(
    ["Wash", "Natural", "Honey", "Wet Hulled", "Anaerobic"],
    {
      message: "Metode proses tidak valid",
    },
  ),
  roastLevel: z.enum(
    ["Light", "Medium-Light", "Medium", "Medium-Dark", "Dark"],
    {
      message: "Tingkat sangrai tidak valid",
    },
  ),
  flavorNotes: z
    .string()
    .min(3, "Catatan rasa minimal 3 karakter")
    .max(200, "Catatan rasa maksimal 200 karakter"),
  acidityScore: z.number().min(0).max(5, "Skor maksimal 5"),
  bodyScore: z.number().min(0).max(5, "Skor maksimal 5"),
  sweetnessScore: z.number().min(0).max(5).optional(),
  aromaScore: z.number().min(0).max(5).optional(),
  aftertasteScore: z.number().min(0).max(5).optional(),
  roastDate: z.string().min(1, "Tanggal sangrai wajib diisi"),
  images: z
    .array(listingImageSchema)
    .max(IMAGE_RULES.maxCount, `Maksimal ${IMAGE_RULES.maxCount} foto`),
});

export const listingSchema = listingBaseSchema.superRefine((value, ctx) => {
  if (value.status === "active" && value.images.length === 0) {
    ctx.addIssue({
      code: "custom",
      path: ["images"],
      message: "Listing aktif minimal punya 1 foto",
    });
  }
});

export type ListingFormValues = z.infer<typeof listingSchema>;
