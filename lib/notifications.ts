import { normalizeWhatsAppNumber } from "@/components/shared/whatsapp-button";
import { formatRupiah } from "@/components/shared/price-text";

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

Dana saat ini telah aman tersimpan di Rekening Escrow Biji Hub. Silakan buka Dashboard Penjual Anda untuk memproses dan menginput nomor resi pengiriman: https://bji-hub.vercel.app/dashboard/orders

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

Anda dapat memantau status pesanan dan konfirmasi penerimaan barang di: https://bji-hub.vercel.app/order/success?orderNumber=${data.orderNumber}

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

Dana telah dikirimkan ke rekening Anda tanpa potongan biaya admin. Pantau riwayat keuangan Anda di: https://bji-hub.vercel.app/dashboard/orders

Salam hangat,
Tim Finansial Biji Hub`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
