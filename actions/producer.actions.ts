"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole, requireSeller } from "@/lib/auth/session";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import {
  createProducer,
  verifyProducerClaims,
  getProducers,
  requestProducerAttribution,
  approveProducerAttribution,
  rejectProducerAttribution,
  getProducerAttributions,
  type ProducerAttribution,
} from "@/lib/data/producers";
import { recordAuditLog } from "@/lib/data/audit-logs";
import { getClientIp } from "@/lib/client-ip";
import type { Producer, ProducerKind } from "@/types";

const producerKindSchema = z.enum(["petani", "koperasi", "estate", "processor"]);

const createProducerSchema = z.object({
  name: z.string().min(2, "Nama produser minimal 2 karakter").max(100),
  kind: producerKindSchema,
  originId: z.string().optional().nullable(),
  village: z.string().max(100).optional().nullable(),
  province: z.string().max(100).optional().nullable(),
  altitudeMin: z.number().int().min(0).max(4000).optional().nullable(),
  altitudeMax: z.number().int().min(0).max(4000).optional().nullable(),
  farmersCount: z.number().int().min(1).optional().nullable(),
  story: z.string().max(2000).optional().nullable(),
  certifications: z.array(z.string()).default([]),
  photoUrls: z.array(z.string().url()).default([]),
});

export async function createProducerAction(
  input: unknown
): Promise<ActionResult<Producer>> {
  try {
    await requireRole(["admin"], "/admin/producers");
    const parsed = createProducerSchema.safeParse(input);
    if (!parsed.success) {
      return fail("Data produser tidak valid: " + parsed.error.issues[0]?.message);
    }

    const created = await createProducer({
      name: parsed.data.name,
      kind: parsed.data.kind as ProducerKind,
      originId: parsed.data.originId,
      village: parsed.data.village,
      province: parsed.data.province,
      altitudeMin: parsed.data.altitudeMin,
      altitudeMax: parsed.data.altitudeMax,
      farmersCount: parsed.data.farmersCount,
      story: parsed.data.story,
      certifications: parsed.data.certifications,
      photoUrls: parsed.data.photoUrls,
    });

    revalidatePath("/admin/producers");
    revalidatePath("/petani");
    revalidatePath("/asal-kopi");
    return ok(created);
  } catch (error) {
    return fail("Gagal menambahkan produser: " + (error as Error).message);
  }
}

export async function verifyProducerClaimsAction(
  producerId: string
): Promise<ActionResult<Producer>> {
  try {
    const session = await requireRole(["admin"], "/admin/producers");
    if (!producerId) {
      return fail("ID produser tidak valid.");
    }

    const updated = await verifyProducerClaims(producerId);
    if (!updated) {
      return fail("Produser tidak ditemukan.");
    }

    const ip = await getClientIp();
    await recordAuditLog({
      actorId: session.userId || "admin",
      actorRole: "admin",
      action: "producer.claims_verified",
      targetId: producerId,
      targetType: "producer",
      ipAddress: ip,
      details: {
        producerName: updated.name,
        certifications: updated.certifications,
      },
    });

    revalidatePath("/admin/producers");
    revalidatePath(`/petani/${updated.slug}`);
    revalidatePath("/petani");
    revalidatePath("/asal-kopi");
    return ok(updated);
  } catch (error) {
    return fail("Gagal memverifikasi klaim produser: " + (error as Error).message);
  }
}

export async function getVerifiedProducersAction(): Promise<ActionResult<Producer[]>> {
  try {
    const list = await getProducers({ verifiedOnly: true });
    return ok(list);
  } catch (error) {
    return fail("Gagal mengambil data produser: " + (error as Error).message);
  }
}

export async function requestProducerAttributionAction(
  producerId: string,
  evidenceUrl?: string | null
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { sellerId } = await requireSeller("/dashboard/listing");
    if (!producerId) return fail("ID produser wajib diisi");

    await requestProducerAttribution(producerId, sellerId, evidenceUrl);
    const ip = await getClientIp();
    await recordAuditLog({
      actorId: sellerId,
      actorRole: "seller",
      action: "producer.attribution_requested",
      targetId: producerId,
      targetType: "producer",
      ipAddress: ip,
      details: { sellerId, evidenceUrl },
    });

    revalidatePath("/admin/producers");
    return ok({ success: true });
  } catch (error) {
    return fail("Gagal mengajukan atribusi produser: " + (error as Error).message);
  }
}

export async function approveProducerAttributionAction(
  producerId: string,
  sellerId: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const session = await requireRole(["admin"], "/admin/producers");
    if (!producerId || !sellerId) return fail("Data atribusi tidak lengkap");

    await approveProducerAttribution(producerId, sellerId, session.userId || "admin");
    const ip = await getClientIp();
    await recordAuditLog({
      actorId: session.userId || "admin",
      actorRole: "admin",
      action: "producer.attribution_approved",
      targetId: producerId,
      targetType: "producer",
      ipAddress: ip,
      details: { sellerId, approvedBy: session.userId },
    });

    revalidatePath("/admin/producers");
    revalidatePath("/dashboard/listing");
    return ok({ success: true });
  } catch (error) {
    return fail("Gagal menyetujui atribusi produser: " + (error as Error).message);
  }
}

export async function rejectProducerAttributionAction(
  producerId: string,
  sellerId: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const session = await requireRole(["admin"], "/admin/producers");
    if (!producerId || !sellerId) return fail("Data atribusi tidak lengkap");

    await rejectProducerAttribution(producerId, sellerId, session.userId || "admin");
    const ip = await getClientIp();
    await recordAuditLog({
      actorId: session.userId || "admin",
      actorRole: "admin",
      action: "producer.attribution_rejected",
      targetId: producerId,
      targetType: "producer",
      ipAddress: ip,
      details: { sellerId, rejectedBy: session.userId },
    });

    revalidatePath("/admin/producers");
    return ok({ success: true });
  } catch (error) {
    return fail("Gagal menolak atribusi produser: " + (error as Error).message);
  }
}

export async function getProducerAttributionsAction(options?: {
  producerId?: string;
  sellerId?: string;
}): Promise<ActionResult<ProducerAttribution[]>> {
  try {
    await requireRole(["admin", "seller"], "/admin/producers");
    const list = await getProducerAttributions(options);
    return ok(list);
  } catch (error) {
    return fail("Gagal mengambil data atribusi: " + (error as Error).message);
  }
}
