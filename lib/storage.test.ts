import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { isOwnedImageUrl } from "./storage";

describe("isOwnedImageUrl", () => {
  const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  });

  afterAll(() => {
    if (originalSupabaseUrl) {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
    } else {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    }
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
  });

  it("rejects lookalike / subdomain spoofing attack URLs", () => {
    const evil =
      "https://example.supabase.co.evil.com/storage/v1/object/public/listings/uploads/x.png";
    expect(isOwnedImageUrl(evil)).toBe(false);
  });

  it("rejects path traversal in URLs", () => {
    const traversal =
      "https://example.supabase.co/storage/v1/object/public/listings/uploads/../../secret/key.txt";
    expect(isOwnedImageUrl(traversal)).toBe(false);
  });

  it("rejects URLs with query parameters or fragments", () => {
    const withQuery =
      "https://example.supabase.co/storage/v1/object/public/listings/uploads/x.png?param=1";
    const withHash =
      "https://example.supabase.co/storage/v1/object/public/listings/uploads/x.png#tag";
    expect(isOwnedImageUrl(withQuery)).toBe(false);
    expect(isOwnedImageUrl(withHash)).toBe(false);
  });

  it("rejects other buckets not in allowed prefixes", () => {
    const invalidBucket =
      "https://example.supabase.co/storage/v1/object/public/private_invoices/doc.pdf";
    expect(isOwnedImageUrl(invalidBucket)).toBe(false);
  });

  it("accepts local mock storage paths without traversal", () => {
    expect(isOwnedImageUrl("/api/mock-storage/test-photo.webp")).toBe(true);
    expect(isOwnedImageUrl("/api/mock-storage/../malicious.png")).toBe(false);
  });
});
