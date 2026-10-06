import { z } from "zod";

export const subscribeSchema = z.object({
  tier: z.enum(["growth", "business"]),
  months: z.union([z.literal(1), z.literal(12)]),
});

export type SubscribeValues = z.infer<typeof subscribeSchema>;
