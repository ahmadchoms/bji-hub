import { describe, it, expect } from "vitest";
import { sanitizeDisplayName } from "./display-name";

describe("sanitizeDisplayName", () => {
  const email = "budi.santoso@example.com";

  it("handles normal name", () => {
    expect(sanitizeDisplayName("Budi Santoso", email)).toBe("Budi Santoso");
  });

  it("falls back to email local part when name is too short (< 2 chars)", () => {
    expect(sanitizeDisplayName("B", email)).toBe("budi.santoso");
    expect(sanitizeDisplayName(" ", email)).toBe("budi.santoso");
  });

  it("truncates names that are too long (> 100 chars)", () => {
    const longName = "A".repeat(120);
    const sanitized = sanitizeDisplayName(longName, email);
    expect(sanitized.length).toBe(100);
    expect(sanitized).toBe("A".repeat(100));
  });

  it("normalizes and collapses excess spaces", () => {
    expect(sanitizeDisplayName("   Budi     Santoso   ", email)).toBe("Budi Santoso");
  });

  it("falls back to email local part when name is empty", () => {
    expect(sanitizeDisplayName("", email)).toBe("budi.santoso");
    expect(sanitizeDisplayName("    ", email)).toBe("budi.santoso");
  });

  it("falls back to email local part or User for undefined/null/non-string", () => {
    expect(sanitizeDisplayName(undefined, email)).toBe("budi.santoso");
    expect(sanitizeDisplayName(null, email)).toBe("budi.santoso");
    expect(sanitizeDisplayName(12345, email)).toBe("budi.santoso");
    expect(sanitizeDisplayName(undefined, undefined)).toBe("User");
  });
});
