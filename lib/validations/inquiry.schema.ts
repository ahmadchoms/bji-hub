import { z } from "zod";

export const inquirySchema = z.object({
  listingId: z.string().min(1, "ID listing wajib diisi"),
  buyerName: z
    .string()
    .min(2, "Nama lengkap harus memiliki minimal 2 karakter")
    .max(100, "Nama terlalu panjang"),
  buyerContact: z
    .string()
    .min(5, "Nomor WhatsApp atau email wajib diisi dengan benar")
    .max(100, "Kontak terlalu panjang"),
  quantity: z
    .string()
    .min(1, "Perkiraan jumlah pesanan wajib diisi (misal: 10 kg / 100 bag)"),
  message: z
    .string()
    .min(10, "Pesan pertanyaan atau spesifikasi RFQ minimal 10 karakter")
    .max(1000, "Pesan maksimal 1.000 karakter"),
});

export type InquiryFormValues = z.infer<typeof inquirySchema>;
