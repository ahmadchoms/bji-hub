"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { requireSeller, requireRole } from "@/lib/auth/session";
import {
  getSellerBankDetails,
  updateSellerBankDetails,
  createPayoutRequestAtomic,
  updatePayoutStatus,
  type SellerBankDetails,
} from "@/lib/data/payouts";

const bankDetailsSchema = z.object({
  bankName: z.string().trim().min(2, "Nama bank wajib dipilih/diisi"),
  bankAccountNumber: z
    .string()
    .trim()
    .regex(/^[0-9]{7,18}$/, "Nomor rekening harus berupa 7 hingga 18 digit angka"),
  bankAccountHolder: z
    .string()
    .trim()
    .min(3, "Nama pemilik rekening minimal 3 karakter")
    .max(100, "Nama pemilik rekening maksimal 100 karakter"),
});

export type BankDetailsFormValues = z.infer<typeof bankDetailsSchema>;

export async function updateSellerBankAction(
  input: unknown,
): Promise<ActionResult<SellerBankDetails>> {
  const { sellerId } = await requireSeller();

  const parsed = bankDetailsSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      "Data rekening bank tidak valid",
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  await updateSellerBankDetails(sellerId, parsed.data);
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/profile");

  return ok(parsed.data);
}

const payoutSchema = z.object({
  amount: z.number().int().min(10000, "Minimal penarikan dana adalah Rp 10.000"),
  notes: z.string().max(200).optional(),
});

export async function requestPayoutAction(
  input: unknown,
): Promise<ActionResult<{ payoutId: string; amount: number }>> {
  const { sellerId } = await requireSeller();

  const parsed = payoutSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      "Jumlah penarikan tidak valid",
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const bankDetails = await getSellerBankDetails(sellerId);
  if (!bankDetails || !bankDetails.bankAccountNumber) {
    return fail("Silakan lengkapi informasi rekening bank tujuan terlebih dahulu");
  }

  const result = await createPayoutRequestAtomic({
    sellerId,
    amount: parsed.data.amount,
    bankDetails,
    notes: parsed.data.notes,
  });

  if (!result.ok) {
    return fail(result.reason);
  }

  revalidatePath("/dashboard/orders");

  return ok({
    payoutId: result.payout.id,
    amount: result.payout.amount,
  });
}

const updatePayoutSchema = z.object({
  payoutId: z.string().min(1, "ID penarikan dana wajib diisi"),
  status: z.enum(["processed", "rejected"]),
  notes: z.string().max(200).optional(),
});

export async function updatePayoutStatusAction(
  input: unknown,
): Promise<ActionResult<{ success: boolean }>> {
  await requireRole(["admin"], "/admin/payouts");

  const parsed = updatePayoutSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Data status tidak valid");
  }

  const success = await updatePayoutStatus(
    parsed.data.payoutId,
    parsed.data.status,
    parsed.data.notes,
  );

  if (!success) {
    return fail("Pengajuan tidak ditemukan atau sudah diproses");
  }

  revalidatePath("/admin/payouts");
  revalidatePath("/dashboard/orders");

  return ok({ success: true });
}

