import { normalizeWhatsAppNumber, formatRupiah } from "@/lib/utils";

function getBaseAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "") || "https://bji-hub.vercel.app";
}

export function buildOrderPaidNotificationUrl(data: {
  sellerPhone: string;
  sellerName?: string;
  buyerName: string;
  orderNumber: string;
  listingTitle: string;
  quantity: number;
  totalAmount: number;
}): string {
  const phone = normalizeWhatsAppNumber(data.sellerPhone);
  const greeting = data.sellerName ? `Halo ${data.sellerName}, ` : "Halo, ";
  const text = `${greeting}ada pesanan baru yang telah berhasil DIBAYAR di Biji Hub!

Nomor Pesanan: ${data.orderNumber}
Produk: ${data.listingTitle} (${data.quantity} pcs/kg)
Pembeli: ${data.buyerName}
Total Pembayaran: ${formatRupiah(data.totalAmount)}

Pembayaran telah terverifikasi aman oleh Biji Hub. Silakan buka Dashboard Penjual Anda untuk memproses dan menginput nomor resi pengiriman: ${getBaseAppUrl()}/dashboard/orders

Terima kasih!`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function buildShipmentNotificationUrl(data: {
  buyerPhone: string;
  buyerName: string;
  sellerName: string;
  orderNumber: string;
  listingTitle: string;
  courier: string;
  trackingNumber: string;
}): string {
  const phone = normalizeWhatsAppNumber(data.buyerPhone);
  const text = `Halo ${data.buyerName}, pesanan biji kopi Anda di Biji Hub telah DIKIRIM oleh ${data.sellerName}!

Nomor Pesanan: ${data.orderNumber}
Produk: ${data.listingTitle}
Kurir Pengiriman: ${data.courier}
Nomor Resi: ${data.trackingNumber}

Anda dapat memantau status pesanan dan konfirmasi penerimaan barang di: ${getBaseAppUrl()}/order/success?orderNumber=${data.orderNumber}

Terima kasih telah berbelanja di Biji Hub!`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function buildPayoutDisbursedNotificationUrl(data: {
  sellerPhone: string;
  sellerName: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  payoutId: string;
}): string {
  const phone = normalizeWhatsAppNumber(data.sellerPhone);
  const text = `Halo ${data.sellerName}, pengajuan penarikan dana Anda di Biji Hub telah SELESAI DITRANSFER oleh tim kami!

Nomor Ref: ${data.payoutId}
Jumlah Pencairan: ${formatRupiah(data.amount)}
Bank Tujuan: Bank ${data.bankName}
No. Rekening: ${data.accountNumber}
Atas Nama: ${data.accountHolder}

Dana telah dikirimkan ke rekening Anda tanpa potongan biaya admin. Pantau riwayat keuangan Anda di: ${getBaseAppUrl()}/dashboard/orders

Salam hangat,
Tim Finansial Biji Hub`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function buildDisputeResolvedNotificationUrl(data: {
  buyerPhone: string;
  buyerName: string;
  orderNumber: string;
  decision: "complete" | "cancel";
  totalAmount: number;
}): string {
  const phone = normalizeWhatsAppNumber(data.buyerPhone);
  const decisionText =
    data.decision === "complete"
      ? "telah diselesaikan oleh tim Admin Biji Hub. Pesanan dinyatakan selesai dan dana telah diteruskan ke mitra roastery."
      : `telah disetujui untuk PEMBATALAN & REFUND. Dana sebesar ${formatRupiah(data.totalAmount)} diproses untuk pengembalian ke rekening Anda.`;

  const text = `Halo ${data.buyerName}, komplain untuk pesanan ${data.orderNumber} ${decisionText}

Pantau rincian pesanan Anda di: ${getBaseAppUrl()}/order/success?orderNumber=${data.orderNumber}

Salam,
Tim Resolusi Sengketa Biji Hub`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

