import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

import { revalidatePath, revalidateTag } from "next/cache";
import { revalidateListing, revalidateStore, CATALOG_TAG } from "./revalidate";

describe("lib/cache/revalidate (N1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revalidates catalog tag, home, and product slug on listing mutation", () => {
    revalidateListing("gayo-specialty-200g");

    expect(revalidateTag).toHaveBeenCalledWith(CATALOG_TAG);
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/product/gayo-specialty-200g");
  });

  it("handles null slug gracefully on listing revalidation", () => {
    revalidateListing(null);

    expect(revalidateTag).toHaveBeenCalledWith(CATALOG_TAG);
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).not.toHaveBeenCalledWith(expect.stringContaining("/product/"));
  });

  it("revalidates catalog tag, home, and store slug on store mutation", () => {
    revalidateStore("toko-kopi-ujang");

    expect(revalidateTag).toHaveBeenCalledWith(CATALOG_TAG);
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/store/toko-kopi-ujang");
  });

  it("catches and ignores errors thrown outside request lifecycle", () => {
    vi.mocked(revalidatePath).mockImplementationOnce(() => {
      throw new Error("revalidatePath outside request lifecycle");
    });

    expect(() => revalidateListing("slug-crash")).not.toThrow();
  });
});
