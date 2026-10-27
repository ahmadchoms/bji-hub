"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { requireRole } from "@/lib/auth/session";
import { moderateListing, reviewVerification } from "@/lib/data";
import { recordAuditLog } from "@/lib/data/audit-logs";
import { getClientIp } from "@/lib/client-ip";

const idSchema = z.string().min(1).max(100);

export async function reviewVerificationAction(
  sellerId: string,
  decision: "approve" | "reject",
): Promise<ActionResult> {
  const session = await requireRole(["admin"], "/admin/verification");
  if (
    !idSchema.safeParse(sellerId).success ||
    !["approve", "reject"].includes(decision)
  ) {
    return fail("Permintaan tidak valid");
  }
  const found = await reviewVerification(sellerId, decision);
  if (!found) return fail("Seller tidak ditemukan");

  const ip = await getClientIp();
  await recordAuditLog({
    actorId: session.userId || "admin",
    actorRole: session.role,
    action: decision === "approve" ? "verify_seller" : "reject_seller",
    targetId: sellerId,
    targetType: "seller",
    ipAddress: ip,
  });

  revalidatePath("/admin/verification");
  revalidatePath("/admin");
  return ok(undefined);
}

export async function moderateListingAction(
  listingId: string,
  decision: "approve" | "suspend",
): Promise<ActionResult> {
  const session = await requireRole(["admin"], "/admin/moderation");
  if (
    !idSchema.safeParse(listingId).success ||
    !["approve", "suspend"].includes(decision)
  ) {
    return fail("Permintaan tidak valid");
  }
  const found = await moderateListing(listingId, decision);
  if (!found) return fail("Listing tidak ditemukan");

  const ip = await getClientIp();
  await recordAuditLog({
    actorId: session.userId || "admin",
    actorRole: session.role,
    action: decision === "approve" ? "approve_listing" : "suspend_listing",
    targetId: listingId,
    targetType: "listing",
    ipAddress: ip,
  });

  revalidatePath("/admin/moderation");
  revalidatePath("/");
  return ok(undefined);
}
