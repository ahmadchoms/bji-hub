"use server";

import { createClient } from "@/lib/supabase/server";
import { ok, type ActionResult } from "@/lib/action-result";
import type { CartItem } from "@/lib/cart";

/**
 * Synchronizes client-side shopping cart with cloud user_metadata for logged-in users.
 * Merges items by listingId + grindSize, keeping user's cart safely across devices and sessions.
 */
export async function syncCloudCartAction(
  localItems: CartItem[],
): Promise<ActionResult<{ items: CartItem[] }>> {
  if (
    process.env.DATA_SOURCE === "mock" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return ok({ items: localItems });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return ok({ items: localItems });
    }

    const cloudItems: CartItem[] = Array.isArray(user.user_metadata?.cart)
      ? user.user_metadata.cart
      : [];

    const itemMap = new Map<string, CartItem>();

    // Start with cloud items
    for (const item of cloudItems) {
      if (item && item.listingId) {
        const key = `${item.listingId}::${item.grindSize || "Biji Utuh"}`;
        itemMap.set(key, item);
      }
    }

    // Merge with local items
    for (const item of localItems) {
      if (item && item.listingId) {
        const key = `${item.listingId}::${item.grindSize || "Biji Utuh"}`;
        itemMap.set(key, item);
      }
    }

    const merged = Array.from(itemMap.values());

    await supabase.auth.updateUser({
      data: { cart: merged },
    });

    return ok({ items: merged });
  } catch {
    return ok({ items: localItems });
  }
}
