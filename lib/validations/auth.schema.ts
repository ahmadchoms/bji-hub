import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z
    .string()
    .min(6, "Kata sandi minimal 6 karakter"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Nama lengkap minimal 2 karakter"),
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z
    .string()
    .min(6, "Kata sandi minimal 6 karakter"),
  termsAccepted: z
    .boolean()
    .refine((val) => val === true, "Anda harus menyetujui syarat & ketentuan direktori"),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const sellerOnboardingSchema = z.object({
  businessName: z
    .string()
    .min(3, "Nama usaha minimal 3 karakter")
    .max(100, "Nama usaha maksimal 100 karakter"),
  whatsappNumber: z
    .string()
    .min(9, "Nomor WhatsApp aktif minimal 9 digit")
    .refine(
      (val) => {
        const clean = val.replace(/[\s-]/g, "");
        return /^(\+62|62|08)[0-9]{8,13}$/.test(clean);
      },
      "Format nomor WhatsApp tidak valid (contoh: 08123456789)"
    )
    .transform((val) => val.replace(/\D/g, "").replace(/^0/, "62")),
  province: z.string().min(1, "Provinsi wajib dipilih"),
  city: z.string().min(1, "Kota/Kabupaten wajib diisi"),
  address: z.string().min(5, "Alamat lengkap minimal 5 karakter"),
});

export type SellerOnboardingFormValues = z.infer<typeof sellerOnboardingSchema>;