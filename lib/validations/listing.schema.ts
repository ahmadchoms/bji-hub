import { z } from "zod";

export const listingSchema = z.object({
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
  processMethod: z.enum(["Wash", "Natural", "Honey", "Wet Hulled", "Anaerobic"], {
    message: "Metode proses tidak valid",
  }),
  roastLevel: z.enum(["Light", "Medium-Light", "Medium", "Medium-Dark", "Dark"], {
    message: "Tingkat sangrai tidak valid",
  }),
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
});

export type ListingFormValues = z.infer<typeof listingSchema>;
