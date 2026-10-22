import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/data/orders";
import { getSession } from "@/lib/auth/session";
import { canAccessOrder } from "@/lib/auth/order-access";
import { InvoicePrintView } from "@/components/order/invoice-print-view";

export const metadata: Metadata = {
  title: "Cetak Dokumen & Invoice Pesanan - Biji Hub",
  description: "Cetak invoice resmi dan label pengiriman pesanan kopi di Biji Hub.",
};

interface InvoicePageProps {
  searchParams: Promise<{
    orderNumber?: string;
    order_number?: string;
    orderId?: string;
    order_id?: string;
    id?: string;
    t?: string;
    mode?: "invoice" | "shipping_label";
    autoPrint?: string;
  }>;
}

export default async function InvoicePage({ searchParams }: InvoicePageProps) {
  const {
    orderNumber,
    order_number,
    orderId,
    order_id,
    id,
    t,
    mode = "invoice",
    autoPrint,
  } = await searchParams;

  const lookupId = orderNumber || order_number || orderId || order_id || id;
  if (!lookupId) {
    notFound();
  }

  const order = await getOrderById(lookupId);
  if (!order) {
    notFound();
  }

  const session = await getSession();
  if (!canAccessOrder(order, session, t)) {
    notFound();
  }

  return (
    <InvoicePrintView
      order={order}
      initialMode={mode === "shipping_label" ? "shipping_label" : "invoice"}
      autoPrint={autoPrint === "true"}
    />
  );
}
