"use server";

import { revalidatePath } from "next/cache";
import { inquirySchema } from "@/lib/validations/inquiry.schema";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { createInquiry, getListingById } from "@/lib/data";
import { checkRateLimit } from "@/lib/rate-limit";

export async function submitInquiryAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = inquirySchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      "Data tidak valid",
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  // Rate limit: max 5 inquiries per minute per buyer contact
  const rl = checkRateLimit(`inquiry:${parsed.data.buyerContact.trim()}`, 5, 60_000);
  if (!rl.success) {
    return fail("Terlalu banyak permintaan pesan. Mohon tunggu 1 menit.");
  }

  const listing = await getListingById(parsed.data.listingId);
  if (!listing || listing.status !== "active") {
    return fail("Listing tidak tersedia");
  }

  const inquiry = await createInquiry(parsed.data);
  revalidatePath("/dashboard/inquiry");
  return ok({ id: inquiry.id });
}
