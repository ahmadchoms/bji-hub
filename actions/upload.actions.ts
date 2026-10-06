"use server";

import { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { requireSeller } from "@/lib/auth/session";
import { createImageUploadTarget } from "@/lib/data";
import { IMAGE_RULES, isAllowedImageType } from "@/lib/storage";

const uploadRequestSchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z
    .string()
    .refine(isAllowedImageType, "Format harus JPG, PNG, atau WebP"),
  size: z
    .number()
    .int()
    .min(1)
    .max(IMAGE_RULES.maxBytes, "Ukuran maksimal 2 MB"),
});

export interface UploadTargetData {
  uploadUrl: string;
  publicUrl: string;
  path: string;
}

/** Step 1 of a direct-to-storage upload: the client then PUTs the file to `uploadUrl`. */
export async function createImageUploadAction(
  input: unknown,
): Promise<ActionResult<UploadTargetData>> {
  const { sellerId } = await requireSeller("/dashboard/listing");
  const parsed = uploadRequestSchema.safeParse(input);
  if (!parsed.success)
    return fail(parsed.error.issues[0]?.message ?? "File tidak valid");

  const target = createImageUploadTarget({
    sellerId,
    contentType: parsed.data.contentType,
    size: parsed.data.size,
  });
  if (!target) return fail("File tidak dapat diunggah");
  return ok(target);
}
