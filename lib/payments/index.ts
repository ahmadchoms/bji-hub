import type { PaymentProvider } from "./types";
import { midtransProvider } from "./midtrans-provider";
import { mockProvider } from "./mock-provider";

export function getPaymentProvider(): PaymentProvider {
  const selected = process.env.PAYMENT_PROVIDER ?? "midtrans";
  if (selected === "mock") return mockProvider;
  if (selected === "midtrans") return midtransProvider;
  throw new Error(`PAYMENT_PROVIDER tidak dikenal: ${selected}`);
}

export * from "./types";
export * from "./labels";
export { midtransProvider } from "./midtrans-provider";
export { mockProvider } from "./mock-provider";
