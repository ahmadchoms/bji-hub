import { describe, it, expect, vi, afterEach } from "vitest";
import { getPaymentProvider, manualProvider, mockProvider, midtransProvider } from "./index";

describe("getPaymentProvider", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to manual provider when PAYMENT_PROVIDER is not set", () => {
    delete process.env.PAYMENT_PROVIDER;
    const provider = getPaymentProvider();
    expect(provider.id).toBe("manual");
    expect(provider).toBe(manualProvider);
  });

  it("returns mock provider when PAYMENT_PROVIDER is 'mock'", () => {
    vi.stubEnv("PAYMENT_PROVIDER", "mock");
    const provider = getPaymentProvider();
    expect(provider.id).toBe("mock");
    expect(provider).toBe(mockProvider);
  });

  it("returns manual provider when PAYMENT_PROVIDER is 'manual'", () => {
    vi.stubEnv("PAYMENT_PROVIDER", "manual");
    const provider = getPaymentProvider();
    expect(provider.id).toBe("manual");
    expect(provider).toBe(manualProvider);
  });

  it("returns midtrans provider when PAYMENT_PROVIDER is 'midtrans'", () => {
    vi.stubEnv("PAYMENT_PROVIDER", "midtrans");
    const provider = getPaymentProvider();
    expect(provider.id).toBe("midtrans");
    expect(provider).toBe(midtransProvider);
  });

  it("throws error when PAYMENT_PROVIDER is unknown", () => {
    vi.stubEnv("PAYMENT_PROVIDER", "unsupported_gateway");
    expect(() => getPaymentProvider()).toThrowError(
      /PAYMENT_PROVIDER tidak dikenal: unsupported_gateway/,
    );
  });
});
