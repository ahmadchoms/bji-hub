import { z } from "zod";

export const boostSchema = z.object({
  listingId: z.string().min(1, "Listing wajib dipilih"),
  duration: z.enum(["7", "14", "30"], {
    message: "Durasi boost tidak valid",
  }),
  useCredit: z.boolean().default(false),
});

export type BoostFormValues = z.infer<typeof boostSchema>;
