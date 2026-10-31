import { describe, it, expect } from "vitest";
import { evaluateListingClaims } from "./claims";

describe("lib/moderation/claims (F3)", () => {
  it("approves clean coffee listing without sensitive claims", () => {
    const res = evaluateListingClaims(
      "Gayo Arabica Natural Anaerobic 250g",
      "Kopi arabika proses natural dengan rasa peach dan floral dari Takengon, Aceh.",
      [],
    );

    expect(res.compliant).toBe(true);
    expect(res.needsReview).toBe(false);
    expect(res.flags.length).toBe(0);
  });

  it("flags prohibited health claims", () => {
    const res = evaluateListingClaims(
      "Kopi Sehat Herbal Alami",
      "Kopi berkhasiat ampuh menyembuhkan diabetes dan menurunkan risiko stroke.",
      [],
    );

    expect(res.compliant).toBe(false);
    expect(res.needsReview).toBe(true);
    expect(res.flags.some((f) => f.kind === "prohibited")).toBe(true);
  });

  it("flags unverified organic claims when badge is missing", () => {
    const resWithoutBadge = evaluateListingClaims(
      "Kopi Arabika Organik Flores Bajawa",
      "Ditanam 100% secara organik di lereng Gunung Inerie tanpa pestisida kimiawi.",
      [], // no badge
    );

    expect(resWithoutBadge.compliant).toBe(false);
    expect(resWithoutBadge.needsReview).toBe(true);
    expect(resWithoutBadge.flags.some((f) => f.term === "organik")).toBe(true);

    // When verified organic badge is present, it is accepted
    const resWithBadge = evaluateListingClaims(
      "Kopi Arabika Organik Flores Bajawa",
      "Ditanam 100% secara organik di lereng Gunung Inerie tanpa pestisida kimiawi.",
      ["organic"],
    );

    expect(resWithBadge.compliant).toBe(true);
    expect(resWithBadge.needsReview).toBe(false);
  });

  it("blocks caged luwak claims", () => {
    const res = evaluateListingClaims(
      "Kopi Luwak Istimewa",
      "Diproses dari luwak kandang terpelihara dengan pakan pilihan.",
      [],
    );

    expect(res.compliant).toBe(false);
    expect(res.flags.some((f) => f.kind === "prohibited")).toBe(true);
  });
});
