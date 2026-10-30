import { z } from "zod";
import { IMAGE_RULES } from "../storage";

const DAY_MS = 86_400_000;

export const roastDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00+07:00`).getTime();
    if (Number.isNaN(parsed)) return false;
    const now = Date.now();
    return parsed <= now + DAY_MS && parsed >= now - 3 * 365 * DAY_MS;
  }, "Tanggal sangrai tidak boleh di masa depan atau lebih dari 3 tahun lalu");

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
  stock: z.number().int().min(0, "Stok minimal 0").optional(),
  status: z.enum(["active", "draft", "archived"], {
    message: "Status listing tidak valid",
  }),
  originRegion: z.string().optional(),
  processMethod: z
    .enum(["Wash", "Natural", "Honey", "Wet Hulled", "Anaerobic"])
    .optional(),
  roastLevel: z
    .enum(["Light", "Medium-Light", "Medium", "Medium-Dark", "Dark"])
    .optional(),
  flavorNotes: z.string().max(200, "Catatan rasa maksimal 200 karakter").optional(),
  acidityScore: z.number().min(0).max(5, "Skor maksimal 5").optional(),
  bodyScore: z.number().min(0).max(5, "Skor maksimal 5").optional(),
  sweetnessScore: z.number().min(0).max(5).optional(),
  aromaScore: z.number().min(0).max(5).optional(),
  aftertasteScore: z.number().min(0).max(5).optional(),
  cropYear: z.string().max(20).optional(),
  moistureContent: z.number().min(0).max(100).optional(),
  cuppingScore: z.number().min(0).max(100, "Skor cupping maksimal 100").optional(),
  altitude: z.string().max(50, "Ketinggian maksimal 50 karakter").optional(),
  producerId: z.string().uuid("ID produser tidak valid").optional().nullable(),
  lotCode: z.string().max(50, "Kode lot maksimal 50 karakter").optional().nullable(),
  varieties: z.array(z.string().max(50)).optional(),
  harvestMonth: z.number().int().min(1).max(12, "Bulan panen 1-12").optional().nullable(),
  fermentationHours: z.number().int().min(0).max(1000).optional().nullable(),
  dryingDays: z.number().int().min(0).max(100).optional().nullable(),
  roastDate: z.string().optional(),
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

  const isGreenBean =
    value.categoryId === "cat-1" ||
    value.categoryId === "green-beans" ||
    value.categoryId.toLowerCase().includes("green");

  const isEquipment =
    value.categoryId === "cat-4" ||
    value.categoryId === "equipment" ||
    value.categoryId.toLowerCase().includes("equipment");

  if (value.status === "active") {
    if (isGreenBean) {
      if (!value.cropYear || !value.cropYear.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["cropYear"],
          message: "Tahun panen (crop year) wajib diisi untuk green bean aktif",
        });
      }
    } else if (!isEquipment) {
      if (!value.roastDate || !value.roastDate.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["roastDate"],
          message: "Tanggal sangrai wajib diisi untuk kopi sangrai aktif",
        });
      }
    }
  }

  if (value.roastDate && value.roastDate.trim() !== "") {
    const res = roastDateSchema.safeParse(value.roastDate);
    if (!res.success) {
      ctx.addIssue({
        code: "custom",
        path: ["roastDate"],
        message:
          res.error.issues[0]?.message || "Format tanggal tidak valid",
      });
    }
  }
});

export type ListingFormValues = z.infer<typeof listingSchema>;
