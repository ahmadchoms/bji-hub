"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getListingById } from "@/lib/data";
import { logger } from "@/lib/logger";
import type { CartItem } from "@/lib/cart";

const cartItemSchema = z.object({
  listingId: z.string().min(1).max(64),
  slug: z.string().max(100).optional(),
  title: z.string().max(200).optional(),
  price: z.number().nonnegative().optional(),
  unit: z.string().max(20).optional(),
  minOrderQty: z.number().int().positive().optional(),
  quantity: z.number().int().min(1).max(999),
  imageUrl: z.string().max(500).optional(),
  sellerId: z.string().max(64).optional(),
  sellerName: z.string().max(100).optional(),
  sellerCity: z.string().max(100).optional(),
  grindSize: z.string().max(50).optional().nullable(),
});

const cartSyncSchema = z.array(cartItemSchema).max(50);

/**
 * Synchronizes client-side shopping cart with cloud user_metadata for logged-in users.
 * Supports:
 * - "merge": merges cloud items with local items (used upon initial login/device sync).
 * - "replace": overwrites cloud items with local items (used when items are added/removed/updated).
 * Validates inputs strictly with Zod (max 50 items) and logs structured warnings on failure.
 */
export async function syncCloudCartAction(
  localItems: unknown,
  mode: "merge" | "replace" = "merge",
): Promise<ActionResult<{ items: CartItem[] }>> {
  const parsed = cartSyncSchema.safeParse(localItems);
  if (!parsed.success) {
    return fail("Data keranjang tidak valid");
  }
  const validLocalItems: CartItem[] = parsed.data as CartItem[];

  if (
    process.env.DATA_SOURCE === "mock" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return ok({ items: validLocalItems });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return ok({ items: validLocalItems });
    }

    let finalItems: CartItem[];

    if (mode === "replace") {
      finalItems = validLocalItems.slice(0, 50);
    } else {
      const cloudRaw = Array.isArray(user.user_metadata?.cart)
        ? user.user_metadata.cart
        : [];
      const cloudParsed = cartSyncSchema.safeParse(cloudRaw);
      const cloudItems = cloudParsed.success ? cloudParsed.data : [];

      const itemMap = new Map<string, CartItem>();

      // Start with cloud items
      for (const item of cloudItems) {
        if (item && item.listingId) {
          const key = `${item.listingId}::${item.grindSize || "Biji Utuh"}`;
          itemMap.set(key, item as CartItem);
        }
      }

      // Merge with local items
      for (const item of validLocalItems) {
        if (item && item.listingId) {
          const key = `${item.listingId}::${item.grindSize || "Biji Utuh"}`;
          itemMap.set(key, item);
        }
      }

      // Enrich any cloud items that were missing local details
      for (const [key, item] of itemMap.entries()) {
        if (!item.title || !item.price) {
          const listing = await getListingById(item.listingId);
          if (listing) {
            itemMap.set(key, {
              listingId: listing.id,
              slug: listing.slug,
              title: listing.title,
              price: Number(listing.price),
              unit: listing.unit,
              minOrderQty: listing.minOrderQty,
              quantity: item.quantity,
              imageUrl: listing.images?.[0]?.imageUrl || "",
              sellerId: listing.sellerId,
              sellerName: listing.seller?.businessName || "Roastery Biji Hub",
              sellerCity: listing.seller?.city || "Indonesia",
              grindSize: item.grindSize || "Biji Utuh",
            });
          }
        }
      }

      finalItems = Array.from(itemMap.values()).slice(0, 50);
    }

    // Store only minimal payload to avoid session/cookie bloat (N6)
    const minimalCart = finalItems.map((item) => ({
      listingId: item.listingId,
      quantity: item.quantity,
      grindSize: item.grindSize ?? "Biji Utuh",
    }));

    const { error: updateError } = await supabase.auth.updateUser({
      data: { cart: minimalCart },
    });

    if (updateError) {
      logger.warn("cart.sync_failed", {
        userId: user.id,
        error: updateError.message,
      });
      return ok({ items: validLocalItems });
    }

    return ok({ items: finalItems });
  } catch (err) {
    logger.warn("cart.sync_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return ok({ items: validLocalItems });
  }
}
