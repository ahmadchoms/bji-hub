"use server";

import { createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getSession } from "@/lib/auth/session";
import { getClientIp } from "@/lib/client-ip";
import {
  recordUserConsent,
  hasUserAcceptedLatest,
  type UserConsentRecord,
} from "@/lib/data/consents";
import { ConsentDocument, CURRENT_VERSIONS } from "@/lib/legal/versions";

function hashIp(ip: string): string {
  const salt = process.env.COOKIE_SECRET || "biji-legal-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export async function recordConsentAction(
  document: ConsentDocument,
): Promise<ActionResult<UserConsentRecord>> {
  const session = await getSession();
  if (session.role === "guest" || !session.userId) {
    return fail("Autentikasi diperlukan untuk mencatat persetujuan");
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
