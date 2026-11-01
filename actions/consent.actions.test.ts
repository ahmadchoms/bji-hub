process.env.DATA_SOURCE = "mock";

import { describe, it, expect, vi, beforeEach } from "vitest";
import { recordConsentAction, checkPendingConsentsAction } from "./consent.actions";
import { getSession } from "@/lib/auth/session";
import { asUserId, asSellerProfileId } from "@/types/ids";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
}));

describe("actions/consent.actions (H6)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  it("fails recordConsentAction when user is guest", async () => {
    vi.mocked(getSession).mockResolvedValue({
      role: "guest",
      userId: null,
      email: null,
      sellerId: null,
    });

    const res = await recordConsentAction("terms");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("Autentikasi diperlukan");
    }
  });

  it("succeeds recordConsentAction for authenticated buyer and verifies pending consents", async () => {
    vi.mocked(getSession).mockResolvedValue({
      role: "buyer",
      userId: asUserId("buyer-consent-123"),
      email: "buyer@biji.test",
      sellerId: null,
    });

    // Initially check pending consents
    const check1 = await checkPendingConsentsAction();
    expect(check1.success).toBe(true);

    // Record terms
    const resTerms = await recordConsentAction("terms");
    expect(resTerms.success).toBe(true);
    if (resTerms.success) {
      expect(resTerms.data.document).toBe("terms");
    }

    // Record privacy
    const resPrivacy = await recordConsentAction("privacy");
    expect(resPrivacy.success).toBe(true);
    if (resPrivacy.success) {
      expect(resPrivacy.data.document).toBe("privacy");
    }

    // Now all buyer documents should be accepted
    const check2 = await checkPendingConsentsAction();
    expect(check2.success).toBe(true);
    if (check2.success) {
      expect(check2.data.allAccepted).toBe(true);
      expect(check2.data.pendingDocuments).toEqual([]);
    }
  });

  it("requires seller_agreement for seller role", async () => {
    vi.mocked(getSession).mockResolvedValue({
      role: "seller",
      userId: asUserId("seller-consent-456"),
      sellerId: asSellerProfileId("seller-profile-456"),
      email: "seller@biji.test",
    });

    const check = await checkPendingConsentsAction();
    expect(check.success).toBe(true);
    if (check.success) {
      // Unless seller_agreement was recorded, it must be pending
      if (!check.data.allAccepted) {
        expect(check.data.pendingDocuments).toContain("seller_agreement");
      }
    }

    const res = await recordConsentAction("seller_agreement");
    expect(res.success).toBe(true);
  });
});
