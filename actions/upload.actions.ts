"use server";

import { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { requireSeller } from "@/lib/auth/session";
import { createImageUploadTarget } from "@/lib/data";
import { IMAGE_RULES, isAllowedImageType } from "@/lib/storage";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

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

/** Step 1 of a direct-to-storage upload: client PUTs or uploads directly to cloud storage. */
export async function createImageUploadAction(
  input: unknown,
): Promise<ActionResult<UploadTargetData>> {
  const { sellerId } = await requireSeller("/dashboard/listing");
  const parsed = uploadRequestSchema.safeParse(input);
  if (!parsed.success)
    return fail(parsed.error.issues[0]?.message ?? "File tidak valid");

  // Supabase Storage Cloud Upload when Service Role Key is configured
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    try {
      const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const ext = parsed.data.filename.split(".").pop() || "webp";
      const filePath = `listings/${sellerId}/${crypto.randomUUID()}.${ext}`;

      const { data: signedData, error } = await supabase.storage
        .from("listings")
        .createSignedUploadUrl(filePath);

      if (!error && signedData) {
        const { data: publicUrlData } = supabase.storage
          .from("listings")
          .getPublicUrl(filePath);

        return ok({
          uploadUrl: signedData.signedUrl,
          publicUrl: publicUrlData.publicUrl,
          path: filePath,
        });
      }
    } catch {
      // Fall through to mock storage target if bucket/service fails
    }
  }

  // Mock storage target fallback (local dev & testing)
  const target = createImageUploadTarget({
    sellerId,
    contentType: parsed.data.contentType,
    size: parsed.data.size,
  });
  if (!target) return fail("File tidak dapat diunggah");
  return ok(target);
}
