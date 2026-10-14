"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { requireRole } from "@/lib/auth/session";
import {
  getCoffeeOrigins,
  createCoffeeOrigin,
  updateCoffeeOrigin,
  toggleCoffeeOriginStatus,
} from "@/lib/data/origins";
import type { CoffeeOrigin } from "@/types";

const originSchema = z.object({
  name: z.string().min(2, "Nama wilayah asal minimal 2 karakter").max(80),
  country: z.string().min(2, "Nama negara minimal 2 karakter").max(80),
  islandOrState: z.string().max(80).optional(),
  minAltitude: z.coerce.number().min(0).max(5000).optional(),
  maxAltitude: z.coerce.number().min(0).max(5000).optional(),
  description: z.string().max(500).optional(),
});

export async function getCoffeeOriginsAction(): Promise<ActionResult<CoffeeOrigin[]>> {
  const origins = await getCoffeeOrigins();
  return ok(origins);
}

export async function createCoffeeOriginAction(
  input: unknown
): Promise<ActionResult<CoffeeOrigin>> {
  await requireRole(["admin"], "/admin/origins");
  const parsed = originSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Data wilayah asal kopi tidak valid", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const origin = await createCoffeeOrigin(parsed.data);
  revalidatePath("/admin/origins");
  revalidatePath("/dashboard/listing");
  return ok(origin);
}

export async function updateCoffeeOriginAction(
  id: string,
  input: unknown
): Promise<ActionResult<CoffeeOrigin>> {
  await requireRole(["admin"], "/admin/origins");
  const parsed = originSchema.partial().safeParse(input);
  if (!parsed.success) {
    return fail("Data perbaruan tidak valid");
  }

  const updated = await updateCoffeeOrigin(id, parsed.data);
  if (!updated) return fail("Wilayah asal kopi tidak ditemukan");

  revalidatePath("/admin/origins");
  revalidatePath("/dashboard/listing");
  return ok(updated);
}

export async function toggleCoffeeOriginAction(
  id: string
): Promise<ActionResult<CoffeeOrigin>> {
  await requireRole(["admin"], "/admin/origins");
  const updated = await toggleCoffeeOriginStatus(id);
  if (!updated) return fail("Wilayah asal kopi tidak ditemukan");

  revalidatePath("/admin/origins");
  revalidatePath("/dashboard/listing");
  return ok(updated);
}
