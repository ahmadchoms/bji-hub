import { z } from "zod";

export const BUYER_PROFILE_COOKIE = "biji-buyer-profile";
export const MAX_COOKIE_SIZE_BYTES = 4096;

export const buyerAddressSchema = z.object({
  id: z.string().max(100).default(() => Math.random().toString(36).substring(2, 9)),
  label: z.string().max(40, "Label maksimal 40 karakter").default("Alamat"),
  recipientName: z.string().max(100, "Nama penerima maksimal 100 karakter").default(""),
  phone: z
    .string()
    .max(25)
    .refine(
      (val) => {
        if (!val) return true;
        const clean = val.replace(/[\s-]/g, "");
        return /^(\+62|62|08)[0-9]{7,13}$/.test(clean);
      },
      "Format nomor telepon tidak valid",
    )
    .default(""),
  province: z.string().max(60, "Provinsi maksimal 60 karakter").default(""),
  city: z.string().max(60, "Kota maksimal 60 karakter").default(""),
  postalCode: z.string().max(10, "Kode pos maksimal 10 karakter").optional().nullable(),
  address: z.string().max(300, "Alamat maksimal 300 karakter").default(""),
  isPrimary: z.boolean().default(false),
});

export const buyerProfileSchema = z.object({
  name: z.string().max(100).optional().nullable(),
  avatarUrl: z.string().max(1000).optional().nullable(),
  phone: z.string().max(25).optional().nullable(),
  province: z.string().max(60).optional().nullable(),
  city: z.string().max(60).optional().nullable(),
  postalCode: z.string().max(10).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  addresses: z.array(buyerAddressSchema).max(10, "Maksimal 10 alamat").default([]),
});

export type BuyerProfileData = z.infer<typeof buyerProfileSchema>;

export interface CookieReader {
  get: (name: string) => { value: string } | undefined;
}

export interface CookieWriter {
  set: (
    name: string,
    value: string,
    options?: {
      path?: string;
      httpOnly?: boolean;
      maxAge?: number;
      sameSite?: "lax" | "strict" | "none";
      secure?: boolean;
    },
  ) => void;
}

export function readBuyerProfileCookie(store: CookieReader): BuyerProfileData {
  try {
    const raw = store.get(BUYER_PROFILE_COOKIE)?.value;
    if (!raw) {
      return { addresses: [] };
    }
    const parsed = JSON.parse(raw);
    const result = buyerProfileSchema.safeParse(parsed);
    if (!result.success) {
      return { addresses: [] };
    }
    return result.data;
  } catch {
    // ignore: cookie parsing fallback to default empty profile
    return { addresses: [] };
  }
}

export function serializeBuyerProfile(data: BuyerProfileData): string {
  const json = JSON.stringify(data);
  const size = Buffer.byteLength(json, "utf8");
  if (size > MAX_COOKIE_SIZE_BYTES) {
    throw new Error(`Ukuran data profil (${size} B) melebihi batas 4KB`);
  }
  return json;
}
