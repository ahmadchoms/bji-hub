"use server";

import { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getSession } from "@/lib/auth/session";
import {
  createBrewRecipe,
  voteBrewRecipe,
  getTopBrewRecipesForListing,
  type BrewRecipeDetail,
} from "@/lib/coffee/recipes";
import { revalidateListing } from "@/lib/cache/revalidate";

const recipeSchema = z.object({
  listingId: z.string().min(1, "ID produk wajib diisi"),
  method: z.string().trim().min(2, "Metode seduh minimal 2 karakter").max(50),
  doseGrams: z.number().min(5, "Dosis kopi minimal 5 gram").max(100),
  waterMl: z.number().min(50, "Jumlah air minimal 50 ml").max(2000),
  tempC: z.number().min(70).max(100).optional().nullable(),
  brewTimeSeconds: z.number().int().min(10).max(600).optional().nullable(),
  grindSize: z.string().max(50).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export async function createBrewRecipeAction(
  input: unknown,
): Promise<ActionResult<{ recipeId: string }>> {
  const session = await getSession();
  if (session.role === "guest" || !session.userId) {
    return fail("Silakan masuk akun terlebih dahulu untuk membagikan resep seduh.");
  }

  const parsed = recipeSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "Data resep seduh tidak valid");
  }

  const res = await createBrewRecipe({
    ...parsed.data,
    userId: session.userId,
  });

  if (!res.success || !res.recipeId) {
    return fail(res.error || "Gagal menyimpan resep seduh");
  }

  revalidateListing(null);
  return ok({ recipeId: res.recipeId });
}

export async function voteBrewRecipeAction(
  recipeId: string,
): Promise<ActionResult<{ voteCount: number; userVoted: boolean }>> {
  const session = await getSession();
  if (session.role === "guest" || !session.userId) {
    return fail("Silakan masuk akun terlebih dahulu untuk menyukai resep.");
  }

  const res = await voteBrewRecipe(recipeId, session.userId);
  if (!res.success) {
    return fail("Gagal mencatat dukungan resep");
  }

  return ok({ voteCount: res.voteCount, userVoted: res.userVoted });
}

export async function getTopBrewRecipesAction(
  listingId: string,
): Promise<ActionResult<BrewRecipeDetail[]>> {
  const list = await getTopBrewRecipesForListing(listingId);
  return ok(list);
}
