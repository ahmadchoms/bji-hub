"use server";

import { revalidatePath } from "next/cache";
import { inquirySchema } from "@/lib/validations/inquiry.schema";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { createInquiry, getListingById } from "@/lib/data";

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

  const listing = await getListingById(parsed.data.listingId);
  if (!listing || listing.status !== "active") {
    return fail("Listing tidak tersedia");
  }

  const inquiry = await createInquiry(parsed.data);
  revalidatePath("/dashboard/inquiry");
  return ok({ id: inquiry.id });
}
