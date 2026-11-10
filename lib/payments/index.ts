import type { PaymentProvider } from "./types";
import { manualProvider } from "./manual-provider";
import { mockProvider } from "./mock-provider";
import { midtransProvider } from "./midtrans-provider";

export function getPaymentProvider(): PaymentProvider {
  // Default ke manual (QRIS Statis & Transfer Bank Manual)
  const selected = process.env.PAYMENT_PROVIDER ?? "manual";
  if (selected === "manual") return manualProvider;
  if (selected === "mock") return mockProvider;
  if (selected === "midtrans") return midtransProvider;
  throw new Error(`PAYMENT_PROVIDER tidak dikenal: ${selected}`);
}

export * from "./types";
export * from "./labels";
export { manualProvider } from "./manual-provider";
export { mockProvider } from "./mock-provider";
export { midtransProvider } from "./midtrans-provider";
