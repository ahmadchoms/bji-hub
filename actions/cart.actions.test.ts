import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncCloudCartAction } from "./cart.actions";
import * as supabaseServer from "@/lib/supabase/server";

describe("syncCloudCartAction", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns local items untouched in mock mode", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const local = [
      {
        listingId: "item-1",
        slug: "gayo",
        title: "Gayo",
        price: 100000,
        unit: "kg",
        minOrderQty: 1,
        quantity: 2,
        sellerId: "seller-1",
        sellerName: "Roastery",
        sellerCity: "Takengon",
      },
    ];

    const result = await syncCloudCartAction(local);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toEqual(local);
    }
  });

  it("merges cloud items and local items for authenticated user", async () => {
    vi.stubEnv("DATA_SOURCE", "prisma");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

    const updateUserMock = vi.fn().mockResolvedValue({ error: null });
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-123",
              user_metadata: {
                cart: [
                  {
                    listingId: "cloud-item",
                    slug: "kintamani",
                    title: "Bali Kintamani",
                    price: 90000,
                    unit: "kg",
                    minOrderQty: 1,
                    quantity: 1,
                    sellerId: "seller-2",
                    sellerName: "Bali Roast",
                    sellerCity: "Bangli",
                    grindSize: "Biji Utuh",
                  },
                ],
              },
            },
          },
        }),
        updateUser: updateUserMock,
      },
    };

    vi.spyOn(supabaseServer, "createClient").mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof supabaseServer.createClient>>);

    const local = [
      {
        listingId: "local-item",
        slug: "toraja",
        title: "Toraja Sapan",
        price: 110000,
        unit: "kg",
        minOrderQty: 1,
        quantity: 3,
        sellerId: "seller-3",
        sellerName: "Toraja Roastery",
        sellerCity: "Makale",
        grindSize: "Giling Halus",
      },
    ];

    const result = await syncCloudCartAction(local);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(2);
      expect(result.data.items.some((i) => i.listingId === "cloud-item")).toBe(true);
      expect(result.data.items.some((i) => i.listingId === "local-item")).toBe(true);
    }
    expect(updateUserMock).toHaveBeenCalledTimes(1);
  });
});
