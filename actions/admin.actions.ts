"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { requireRole } from "@/lib/auth/session";
import { moderateListing, reviewVerification } from "@/lib/data";

const idSchema = z.string().min(1).max(100);

export async function reviewVerificationAction(
  sellerId: string,
  decision: "approve" | "reject",
): Promise<ActionResult> {
  await requireRole(["admin"], "/admin/verification");
  if (
    !idSchema.safeParse(sellerId).success ||
    !["approve", "reject"].includes(decision)
  ) {
    return fail("Permintaan tidak valid");
  }
  const found = await reviewVerification(sellerId, decision);
  if (!found) return fail("Seller tidak ditemukan");
  revalidatePath("/admin/verification");
  revalidatePath("/admin");
  return ok(undefined);
}

export async function moderateListingAction(
  listingId: string,
  decision: "approve" | "suspend",
): Promise<ActionResult> {
  await requireRole(["admin"], "/admin/moderation");
  if (
    !idSchema.safeParse(listingId).success ||
    !["approve", "suspend"].includes(decision)
  ) {
    return fail("Permintaan tidak valid");
  }
  const found = await moderateListing(listingId, decision);
  if (!found) return fail("Listing tidak ditemukan");
  revalidatePath("/admin/moderation");
  revalidatePath("/catalog");
  revalidatePath("/");
  return ok(undefined);
}
