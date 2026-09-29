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
  businessName: z
    .string()
    .min(3, "Nama kebun, koperasi, atau roastery minimal 3 karakter"),
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  whatsappNumber: z
    .string()
    .min(9, "Nomor WhatsApp aktif minimal 9 digit")
    .regex(/^(\+62|62|08)[0-9]{8,13}$/, "Format nomor WhatsApp tidak valid (contoh: 08123456789)"),
  province: z
    .string()
    .min(1, "Provinsi wajib dipilih"),
  city: z
    .string()
    .min(1, "Kota/Kabupaten wajib diisi"),
  address: z
    .string()
    .min(5, "Alamat lengkap minimal 5 karakter"),
  password: z
    .string()
    .min(6, "Kata sandi minimal 6 karakter"),
  termsAccepted: z
    .boolean()
    .refine((val) => val === true, "Anda harus menyetujui syarat & ketentuan direktori"),
  role: z.enum(["buyer", "seller"]),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;