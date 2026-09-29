import { z } from "zod";

export const sellerProfileSchema = z.object({
  businessName: z
    .string()
    .min(3, "Nama usaha minimal 3 karakter")
    .max(100, "Nama usaha maksimal 100 karakter"),
  province: z.string().min(1, "Provinsi wajib dipilih"),
  city: z.string().min(1, "Kota/Kabupaten wajib diisi"),
  address: z.string().min(5, "Alamat lengkap minimal 5 karakter"),
  whatsappNumber: z
    .string()
    .min(9, "Nomor WhatsApp aktif minimal 9 digit")
    .regex(
      /^(\+62|62|08)[0-9]{8,13}$/,
      "Format nomor WhatsApp tidak valid (contoh: 08123456789)"
    ),
  bio: z
    .string()
    .max(500, "Bio maksimal 500 karakter")
    .optional(),
});

export type SellerProfileFormValues = z.infer<typeof sellerProfileSchema>;
