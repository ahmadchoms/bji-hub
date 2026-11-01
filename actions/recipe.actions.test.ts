process.env.DATA_SOURCE = "mock";

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createBrewRecipeAction,
  voteBrewRecipeAction,
  getTopBrewRecipesAction,
} from "./recipe.actions";
import { getSession } from "@/lib/auth/session";
import { asUserId } from "@/types/ids";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/cache/revalidate", () => ({
  revalidateListing: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/coffee/recipes", () => ({
  createBrewRecipe: vi.fn().mockImplementation(async (input) => {
    if (!input.userId) return { success: false, error: "Unauthorized" };
    return { success: true, recipeId: "recipe-123" };
  }),
  voteBrewRecipe: vi.fn().mockResolvedValue({
    success: true,
    voteCount: 5,
    userVoted: true,
  }),
  getTopBrewRecipesForListing: vi.fn().mockResolvedValue([
    {
      id: "recipe-1",
      listingId: "listing-1",
      userId: "user-1",
      method: "V60",
      doseGrams: 15,
      waterMl: 225,
      tempC: 92,
      brewTimeSeconds: 150,
      grindSize: "Medium",
      notes: "Clean sweet cup",
      votesCount: 3,
      createdAt: "2026-10-01T00:00:00Z",
    },
  ]),
}));

describe("actions/recipe.actions (H5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails createBrewRecipeAction for guest session", async () => {
    vi.mocked(getSession).mockResolvedValue({
      role: "guest",
      userId: null,
      email: null,
      sellerId: null,
    });

    const res = await createBrewRecipeAction({
      listingId: "listing-1",
      method: "V60",
      doseGrams: 15,
      waterMl: 225,
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("masuk akun terlebih dahulu");
    }
  });

  it("succeeds createBrewRecipeAction for authenticated user", async () => {
    vi.mocked(getSession).mockResolvedValue({
      role: "buyer",
      userId: asUserId("user-123"),
      email: "buyer@biji.test",
      sellerId: null,
    });

    const res = await createBrewRecipeAction({
      listingId: "listing-1",
      method: "V60",
      doseGrams: 15,
      waterMl: 225,
      tempC: 92,
      brewTimeSeconds: 150,
      grindSize: "Medium-Fine",
      notes: "Tuang merata",
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.recipeId).toBe("recipe-123");
    }
  });

  it("toggles vote on recipe for authenticated user", async () => {
    vi.mocked(getSession).mockResolvedValue({
      role: "buyer",
      userId: asUserId("user-123"),
      email: "buyer@biji.test",
      sellerId: null,
    });

    const res = await voteBrewRecipeAction("recipe-1");
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.voteCount).toBe(5);
      expect(res.data.userVoted).toBe(true);
    }
  });

  it("retrieves top brew recipes for a listing", async () => {
    const res = await getTopBrewRecipesAction("listing-1");
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.length).toBe(1);
      expect(res.data[0].method).toBe("V60");
    }
  });
});
