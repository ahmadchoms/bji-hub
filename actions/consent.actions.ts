"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getSession } from "@/lib/auth/session";
import { getClientIp } from "@/lib/client-ip";
import {
  recordUserConsent,
  hasUserAcceptedLatest,
  hashIp,
  type UserConsentRecord,
} from "@/lib/data/consents";
import { ConsentDocument, CURRENT_VERSIONS } from "@/lib/legal/versions";

const consentDocumentSchema = z.enum(["terms", "privacy", "seller_agreement"]);

export async function recordConsentAction(
  rawDocument: unknown,
): Promise<ActionResult<UserConsentRecord>> {
  const session = await getSession();
  if (session.role === "guest" || !session.userId) {
    return fail("Autentikasi diperlukan untuk mencatat persetujuan");
  }

  const parseResult = consentDocumentSchema.safeParse(rawDocument);
  if (!parseResult.success) {
    return fail("Dokumen persetujuan tidak valid");
  }

  const document = parseResult.data;
  if (document === "seller_agreement" && session.role !== "seller") {
    return fail("Perjanjian Penjual hanya dapat disetujui oleh penjual");
  }

  const clientIp = await getClientIp();
  const ipHash = hashIp(clientIp);

  const consent = await recordUserConsent({
    userId: session.userId,
    document,
    version: CURRENT_VERSIONS[document],
    ipHash,
  });

  revalidatePath("/", "layout");
  return ok(consent);
}

export async function checkPendingConsentsAction(): Promise<
  ActionResult<{
    allAccepted: boolean;
    pendingDocuments: ConsentDocument[];
  }>
> {
  const session = await getSession();
  if (session.role === "guest" || !session.userId) {
    return ok({ allAccepted: true, pendingDocuments: [] });
  }

  const requiredDocs: ConsentDocument[] = ["terms", "privacy"];
  if (session.role === "seller") {
    requiredDocs.push("seller_agreement");
  }

  const pending: ConsentDocument[] = [];
  for (const doc of requiredDocs) {
    const accepted = await hasUserAcceptedLatest(session.userId, doc);
    if (!accepted) {
      pending.push(doc);
    }
  }

  return ok({
    allAccepted: pending.length === 0,
    pendingDocuments: pending,
  });
}
