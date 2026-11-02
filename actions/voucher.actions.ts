"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getSession } from "@/lib/auth/session";
import { isAdminAllowed } from "@/lib/auth/admin-guard";
import { recordAuditLog } from "@/lib/data/audit-logs";
import { getClientIp } from "@/lib/client-ip";
import {
  validateVoucher,
  createVoucher,
  toggleVoucherActive,
  getVoucherByCode,
  type VoucherData,
  type DiscountFundedBy,
} from "@/lib/data/vouchers";

const validateVoucherSchema = z.object({
  code: z.string().trim().min(1, "Kode voucher wajib diisi").max(50),
  subtotal: z.number().min(0),
  shippingCost: z.number().min(0),
  sellerId: z.string().optional().nullable(),
});

export async function validateVoucherAction(input: unknown): Promise<
  ActionResult<{
    voucher: VoucherData;
    discountAmount: number;
    discountFundedBy: DiscountFundedBy;
  }>
> {
  const parsed = validateVoucherSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      "Format voucher tidak valid",
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const session = await getSession();
  const clientIp = await getClientIp();
  // Note (J8): Guest vouchers use guest:${clientIp}. This is an intentional lightweight constraint; shared NATs share quota and dynamic IPs bypass it. High-value one-time promotional vouchers should require authenticated user accounts.
  const userKey = session.userId || `guest:${clientIp}`;

  const res = await validateVoucher({
    code: parsed.data.code,
    subtotal: parsed.data.subtotal,
    shippingCost: parsed.data.shippingCost,
    sellerId: parsed.data.sellerId,
    userKey,
  });

  if (!res.valid || !res.voucher || res.discountAmount === undefined) {
    return fail(res.reason || "Voucher tidak dapat digunakan");
  }

  return ok({
    voucher: res.voucher,
    discountAmount: res.discountAmount,
    discountFundedBy: res.discountFundedBy || "platform",
  });
}

const createVoucherSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Kode voucher minimal 3 karakter")
    .max(20, "Kode voucher maksimal 20 karakter")
    .regex(/^[A-Z0-9_-]+$/i, "Kode voucher hanya boleh huruf, angka, minus, dan underscore"),
  type: z.enum(["percent", "fixed", "free_shipping"]),
  value: z.number().min(0, "Nilai voucher minimal 0"),
  minSubtotal: z.number().min(0).default(0),
  maxDiscount: z.number().min(0).optional().nullable(),
  startsAt: z.string().min(1, "Tanggal mulai wajib diisi"),
  endsAt: z.string().min(1, "Tanggal selesai wajib diisi"),
  usageLimit: z.number().int().min(1).optional().nullable(),
  perUserLimit: z.number().int().min(1).default(1),
  sellerId: z.string().optional().nullable(),
});

export type CreateVoucherFormValues = z.infer<typeof createVoucherSchema>;

export async function createVoucherAction(
  input: unknown,
): Promise<ActionResult<VoucherData>> {
  const session = await getSession();
  if (session.role === "guest" || !session.userId) {
    return fail("Autentikasi diperlukan");
  }

  const parsed = createVoucherSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      "Data pembuatan voucher tidak valid",
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const data = parsed.data;
  let targetSellerId: string | null = null;
  const isAdmin = await isAdminAllowed(session);

  if (isAdmin) {
    targetSellerId = data.sellerId || null;
  } else if (session.role === "seller" && session.sellerId) {
    targetSellerId = session.sellerId;
  } else {
    return fail("Hanya penjual dan admin yang dapat membuat voucher");
  }

  // Check unique code
  const existing = await getVoucherByCode(data.code);
  if (existing) {
    return fail(`Kode voucher "${data.code.toUpperCase()}" sudah digunakan. Gunakan kode lain.`);
  }

  const voucher = await createVoucher({
    code: data.code,
    sellerId: targetSellerId,
    type: data.type,
    value: data.value,
    minSubtotal: data.minSubtotal,
    maxDiscount: data.maxDiscount,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    usageLimit: data.usageLimit,
    perUserLimit: data.perUserLimit,
  });

  await recordAuditLog({
    actorId: session.userId,
    actorRole: session.role,
    action: "voucher.created",
    targetType: "voucher",
    targetId: voucher.id,
    details: {
      code: voucher.code,
      sellerId: voucher.sellerId,
      type: voucher.type,
      value: voucher.value,
    },
  });

  revalidatePath("/dashboard/vouchers");
  revalidatePath("/admin/vouchers");

  return ok(voucher);
}

export async function toggleVoucherActiveAction(
  voucherId: string,
  active: boolean,
): Promise<ActionResult<boolean>> {
  const session = await getSession();
  if (session.role === "guest" || !session.userId) {
    return fail("Autentikasi diperlukan");
  }

  const success = await toggleVoucherActive(voucherId, active);
  if (!success) {
    return fail("Gagal memperbarui status voucher");
  }

  await recordAuditLog({
    actorId: session.userId,
    actorRole: session.role,
    action: active ? "voucher.activated" : "voucher.deactivated",
    targetType: "voucher",
    targetId: voucherId,
  });

  revalidatePath("/dashboard/vouchers");
  revalidatePath("/admin/vouchers");

  return ok(true);
}
