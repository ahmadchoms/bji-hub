import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { isOwnedImageUrl, validateKycFile, isAllowedKycType } from "./storage";

describe("KYC Document Validation (F10/S6)", () => {
  it("accepts valid KYC document formats (JPG, PNG, WebP, PDF)", () => {
    expect(isAllowedKycType("image/jpeg")).toBe(true);
    expect(isAllowedKycType("image/png")).toBe(true);
    expect(isAllowedKycType("image/webp")).toBe(true);
    expect(isAllowedKycType("application/pdf")).toBe(true);
    expect(isAllowedKycType("application/zip")).toBe(false);
    expect(isAllowedKycType("text/html")).toBe(false);
  });

  it("validates file size within 5MB limit", () => {
    expect(validateKycFile({ type: "image/jpeg", size: 1024 * 1024 })).toBeNull();
    expect(validateKycFile({ type: "application/pdf", size: 4.5 * 1024 * 1024 })).toBeNull();
    expect(validateKycFile({ type: "application/pdf", size: 6 * 1024 * 1024 })).toContain(
      "Ukuran dokumen maksimal 5 MB",
    );
    expect(validateKycFile({ type: "application/pdf", size: 0 })).toContain("kosong");
    expect(validateKycFile({ type: "image/gif", size: 1000 })).toContain(
      "Format dokumen harus JPG, PNG, WebP, atau PDF",
    );
  });
});

describe("isOwnedImageUrl", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts valid Supabase storage paths for listings", () => {
    const valid =
      "https://example.supabase.co/storage/v1/object/public/listings/uploads/seller-1/abc.webp";
    expect(isOwnedImageUrl(valid)).toBe(true);
  });

  it("accepts valid Supabase storage paths for logos, disputes, and reviews", () => {
    expect(
      isOwnedImageUrl(
        "https://example.supabase.co/storage/v1/object/public/logos/store.png",
      ),
    ).toBe(true);
    expect(
      isOwnedImageUrl(
        "https://example.supabase.co/storage/v1/object/public/disputes/evidence.jpg",
      ),
    ).toBe(true);
    expect(
      isOwnedImageUrl(
        "https://example.supabase.co/storage/v1/object/public/reviews/product.png",
      ),
    ).toBe(true);
  });

  it("rejects non-supabase hosts", () => {
    expect(
      isOwnedImageUrl(
        "https://malicious-site.com/storage/v1/object/public/listings/abc.webp",
      ),
    ).toBe(false);
    expect(isOwnedImageUrl("https://example.com/logo.png")).toBe(false);
  });

  it("rejects subdomain spoofing attempts", () => {
    expect(
      isOwnedImageUrl(
        "https://example.supabase.co.evil.com/storage/v1/object/public/listings/abc.webp",
      ),
    ).toBe(false);
  });

  it("rejects unapproved buckets and paths", () => {
    expect(
      isOwnedImageUrl(
        "https://example.supabase.co/storage/v1/object/public/private_documents/id.pdf",
      ),
    ).toBe(false);
    expect(
      isOwnedImageUrl(
        "https://example.supabase.co/storage/v1/object/public/users/secret.png",
      ),
    ).toBe(false);
  });

  it("rejects path traversal attempts in pathname", () => {
    expect(
      isOwnedImageUrl(
        "https://example.supabase.co/storage/v1/object/public/listings/../private/abc.webp",
      ),
    ).toBe(false);
  });

  it("rejects invalid URLs gracefully", () => {
    expect(isOwnedImageUrl("not-a-valid-url")).toBe(false);
    expect(isOwnedImageUrl("")).toBe(false);
    expect(isOwnedImageUrl("/relative/path.webp")).toBe(false);
  });
});
