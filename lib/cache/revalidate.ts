import { revalidatePath, revalidateTag } from "next/cache";

export const CATALOG_TAG = "catalog";

export function revalidateListing(slug?: string | null): void {
  try {
    revalidateTag(CATALOG_TAG);
    revalidatePath("/");
    if (slug) {
      revalidatePath(`/product/${slug}`);
    }
  } catch {
    // ignore outside of active Next.js request lifecycle (e.g. background tasks or tests)
  }
}

export function revalidateStore(slug?: string | null): void {
  try {
    revalidateTag(CATALOG_TAG);
    revalidatePath("/");
    if (slug) {
      revalidatePath(`/store/${slug}`);
    }
  } catch {
    // ignore outside of active Next.js request lifecycle
  }
}
