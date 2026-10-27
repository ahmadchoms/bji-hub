import { describe, it, expect } from "vitest";
import { validatePasswordStrength } from "./password-rules";

describe("validatePasswordStrength (B4)", () => {
  it("rejects passwords shorter than 8 characters", () => {
    const res = validatePasswordStrength("1234567");
    expect(res.valid).toBe(false);
    expect(res.error).toContain("minimal 8 karakter");
  });

  it("rejects common passwords regardless of case", () => {
    const res1 = validatePasswordStrength("password123");
    expect(res1.valid).toBe(false);
    expect(res1.error).toContain("terlalu umum");

    const res2 = validatePasswordStrength("ADMIN123");
    expect(res2.valid).toBe(false);
  });

  it("accepts sufficiently strong and unique passwords", () => {
    const res = validatePasswordStrength("KopiGayoTakengon2026!");
    expect(res.valid).toBe(true);
    expect(res.error).toBeUndefined();
  });
});
