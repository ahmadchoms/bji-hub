"use server";

import { createClient } from "@/lib/supabase/server";
import { ok, type ActionResult } from "@/lib/action-result";
import type { WishlistItem } from "@/lib/wishlist";

/**
 * Synchronizes client-side wishlist with cloud user_metadata for logged-in users.
 * Merges items without duplicating by listingId, preserving the newest additions.
 */
export async function syncCloudWishlistAction(
  localItems: WishlistItem[],
): Promise<ActionResult<{ items: WishlistItem[] }>> {
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

    const cloudItems: WishlistItem[] = Array.isArray(user.user_metadata?.wishlist)
      ? user.user_metadata.wishlist
      : [];

    const itemMap = new Map<string, WishlistItem>();
    for (const item of cloudItems) {
      if (item && item.listingId) itemMap.set(item.listingId, item);
    }
    for (const item of localItems) {
      if (item && item.listingId) itemMap.set(item.listingId, item);
    }

    const merged = Array.from(itemMap.values()).sort((a, b) => {
      const timeA = new Date(a.addedAt || 0).getTime();
      const timeB = new Date(b.addedAt || 0).getTime();
      return timeB - timeA;
    });

    await supabase.auth.updateUser({
      data: { wishlist: merged },
    });

    return ok({ items: merged });
  } catch {
    return ok({ items: localItems });
  }
}
