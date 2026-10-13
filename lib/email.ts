import { Resend } from "resend";
import type { Order } from "@/types";
import { formatRupiah } from "@/lib/utils";

let resendClient: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

const FROM_EMAIL = process.env.EMAIL_FROM || "Biji Hub <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bji-hub.vercel.app";

export interface EmailResult {
  success: boolean;
  mocked?: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Sends order payment confirmation & invoice email to buyer.
 */
export async function sendOrderPaidEmail(order: Order): Promise<EmailResult> {
  const resend = getResend();
  const invoiceUrl = `${APP_URL}/order/invoice?orderNumber=${order.orderNumber}`;
  const orderUrl = `${APP_URL}/order/success?orderNumber=${order.orderNumber}`;

  if (!resend || !order.buyerEmail) {
    // Graceful fallback for local development or when API key is missing
    console.log(`[EMAIL MOCK] Order Paid Notification to ${order.buyerEmail || "no-email"}:`, {
      orderNumber: order.orderNumber,
      amount: order.totalAmount,
    });
    return { success: true, mocked: true };
  }

  try {
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1F1815; background-color: #FAF6F1; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #2E150C; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">BIJI HUB</h1>
          <p style="color: #7A4A34; font-size: 13px; margin: 4px 0 0;">Marketplace Biji Kopi Indonesia & Rekening Bersama Escrow</p>
        </div>

        <div style="background-color: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #D8CFC5; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="border-bottom: 2px solid #FAF6F1; padding-bottom: 16px; margin-bottom: 16px;">
            <span style="background-color: #DCEEE3; color: #1E4B36; font-size: 11px; font-weight: bold; padding: 4px 10px; rounded: 4px; border-radius: 4px; text-transform: uppercase;">Pembayaran Dikonfirmasi</span>
            <h2 style="margin: 12px 0 4px; font-size: 18px; color: #1F1815;">Halo ${order.buyerName},</h2>
            <p style="color: #4A403A; font-size: 14px; margin: 0; line-height: 1.5;">
              Pembayaran untuk pesanan <strong style="font-family: monospace;">#${order.orderNumber}</strong> telah berhasil diverifikasi oleh sistem. Dana Anda kini disimpan aman di rekening bersama (escrow) Biji Hub hingga pesanan tiba.
            </p>
          </div>

          <h3 style="font-size: 13px; text-transform: uppercase; color: #8C8078; margin: 16px 0 8px; letter-spacing: 0.5px;">Rincian Pesanan</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
            <tr style="border-bottom: 1px solid #F0E9E1;">
              <td style="padding: 8px 0; color: #1F1815; font-weight: 600;">${order.listingTitle || "Biji Kopi Spesialti"}</td>
              <td style="padding: 8px 0; text-align: center; color: #8C8078;">${order.quantity} pcs/kg</td>
              <td style="padding: 8px 0; text-align: right; font-family: monospace; font-weight: bold;">${formatRupiah(order.subtotal)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #F0E9E1;">
              <td colspan="2" style="padding: 8px 0; color: #4A403A;">Ongkos Kirim (${order.shippingCourier || "Kurir"})</td>
              <td style="padding: 8px 0; text-align: right; font-family: monospace;">${formatRupiah(order.shippingCost)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #F0E9E1;">
              <td colspan="2" style="padding: 8px 0; color: #4A403A;">Biaya Layanan Platform</td>
              <td style="padding: 8px 0; text-align: right; font-family: monospace;">${formatRupiah(order.serviceFee)}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 12px 0 0; font-weight: bold; font-size: 15px; color: #2E150C;">Total Pembayaran</td>
              <td style="padding: 12px 0 0; text-align: right; font-family: monospace; font-weight: bold; font-size: 16px; color: #2E150C;">${formatRupiah(order.totalAmount)}</td>
            </tr>
          </table>

          <div style="background-color: #FAF6F1; border-left: 3px solid #2F6D4F; padding: 12px; margin: 16px 0; font-size: 12px; color: #4A403A;">
            <strong>Alamat Pengiriman:</strong><br/>
            ${order.buyerName} (${order.buyerPhone})<br/>
            ${order.buyerAddress}, ${order.buyerCity}
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="${invoiceUrl}" style="display: inline-block; background-color: #2E150C; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: bold; padding: 12px 24px; border-radius: 6px; margin: 0 4px 8px;">Cetak Invoice Resmi</a>
            <a href="${orderUrl}" style="display: inline-block; background-color: #F0E9E1; color: #2E150C; text-decoration: none; font-size: 13px; font-weight: 600; padding: 12px 20px; border-radius: 6px; margin: 0 4px 8px;">Pantau Pesanan</a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #8C8078;">
          <p style="margin: 0;">Email ini dikirim otomatis oleh Biji Hub. Jika ada kendala, hubungi kami di support@bijihub.id.</p>
        </div>
      </div>
    `;

    const res = await resend.emails.send({
      from: FROM_EMAIL,
      to: order.buyerEmail,
      subject: `[Biji Hub] Konfirmasi Pembayaran Pesanan #${order.orderNumber}`,
      html: htmlContent,
    });

    return {
      success: true,
      messageId: res.data?.id,
    };
  } catch (error) {
    console.error("Failed to send order paid email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

/**
 * Sends shipping notification email with tracking number to buyer.
 */
export async function sendOrderShippedEmail(order: Order): Promise<EmailResult> {
  const resend = getResend();
  const orderUrl = `${APP_URL}/order/success?orderNumber=${order.orderNumber}`;

  if (!resend || !order.buyerEmail) {
    console.log(`[EMAIL MOCK] Order Shipped Notification to ${order.buyerEmail || "no-email"}:`, {
      orderNumber: order.orderNumber,
      trackingNumber: order.trackingNumber,
      courier: order.shippingCourier,
    });
    return { success: true, mocked: true };
  }

  try {
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1F1815; background-color: #FAF6F1; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #2E150C; margin: 0; font-size: 26px; font-weight: 800;">BIJI HUB</h1>
          <p style="color: #7A4A34; font-size: 13px; margin: 4px 0 0;">Notifikasi Pengiriman Pesanan</p>
        </div>

        <div style="background-color: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #D8CFC5;">
          <span style="background-color: #EFDFD5; color: #3D1D10; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 4px; text-transform: uppercase;">Paket Sedang Dikirim</span>
          <h2 style="margin: 12px 0 4px; font-size: 18px; color: #1F1815;">Pesanan #${order.orderNumber} Sedang Menuju Lokasi Anda!</h2>
          <p style="color: #4A403A; font-size: 14px; margin: 0 0 16px; line-height: 1.5;">
            Halo ${order.buyerName}, pihak ${order.sellerName || "roastery"} telah menyerahkan paket kopi Anda ke kurir ekspedisi.
          </p>

          <div style="background-color: #FAF6F1; border: 1px dashed #7A4A34; padding: 16px; border-radius: 6px; margin-bottom: 16px;">
            <table style="width: 100%; font-size: 13px;">
              <tr>
                <td style="color: #7A4A34; font-weight: 500; width: 40%;">Ekspedisi:</td>
                <td style="font-weight: bold; color: #1F1815;">${order.shippingCourier || "JNE"}</td>
              </tr>
              <tr>
                <td style="color: #7A4A34; font-weight: 500;">Nomor Resi:</td>
                <td style="font-weight: bold; font-family: monospace; color: #2E150C; font-size: 15px;">${order.trackingNumber || "-"}</td>
              </tr>
              <tr>
                <td style="color: #7A4A34; font-weight: 500;">Produk:</td>
                <td style="color: #1F1815;">${order.listingTitle || "Biji Kopi"} (${order.quantity} pcs/kg)</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin-top: 20px;">
            <a href="${orderUrl}" style="display: inline-block; background-color: #2F6D4F; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: bold; padding: 12px 24px; border-radius: 6px;">Lacak Resi & Konfirmasi Terima</a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #8C8078;">
          <p style="margin: 0;">Biji Hub &bull; Garansi Rekening Bersama Escrow</p>
        </div>
      </div>
    `;

    const res = await resend.emails.send({
      from: FROM_EMAIL,
      to: order.buyerEmail,
      subject: `[Biji Hub] Pesanan #${order.orderNumber} Sedang Dikirim (${order.shippingCourier || "Kurir"})`,
      html: htmlContent,
    });

    return {
      success: true,
      messageId: res.data?.id,
    };
  } catch (error) {
    console.error("Failed to send order shipped email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

/**
 * Sends low stock warning alert email to seller when inventory drops <= 5.
 */
export async function sendLowStockAlertEmail({
  sellerEmail,
  sellerName,
  listingTitle,
  remainingStock,
  unit,
}: {
  sellerEmail: string;
  sellerName: string;
  listingTitle: string;
  remainingStock: number;
  unit: string;
}): Promise<EmailResult> {
  const resend = getResend();
  const dashboardUrl = `${APP_URL}/dashboard/listing`;

  if (!resend || !sellerEmail) {
    console.log(`[EMAIL MOCK] Low Stock Alert to ${sellerEmail || "no-email"}:`, {
      sellerName,
      listingTitle,
      remainingStock,
      unit,
    });
    return { success: true, mocked: true };
  }

  try {
    const isSoldOut = remainingStock <= 0;
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1F1815; background-color: #FAF6F1; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #2E150C; margin: 0; font-size: 26px; font-weight: 800;">BIJI HUB</h1>
          <p style="color: #7A4A34; font-size: 13px; margin: 4px 0 0;">Peringatan Stok Inventaris Penjual</p>
        </div>

        <div style="background-color: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #D8CFC5;">
          <span style="background-color: ${isSoldOut ? "#FEE2E2" : "#FEF3C7"}; color: ${isSoldOut ? "#991B1B" : "#92400E"}; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 4px; text-transform: uppercase;">
            ${isSoldOut ? "Stok Produk Habis" : "Stok Produk Menipis"}
          </span>
          <h2 style="margin: 12px 0 4px; font-size: 18px; color: #1F1815;">Halo ${sellerName},</h2>
          <p style="color: #4A403A; font-size: 14px; margin: 0 0 16px; line-height: 1.5;">
            ${
              isSoldOut
                ? `Stok untuk produk <strong>"${listingTitle}"</strong> telah habis (0 ${unit}) dan produk telah dinonaktifkan sementara dari katalog publik.`
                : `Stok untuk produk <strong>"${listingTitle}"</strong> tersisa hanya <strong>${remainingStock} ${unit}</strong>. Segera perbarui kuota panen/sangrai Anda.`
            }
          </p>

          <div style="text-align: center; margin-top: 20px;">
            <a href="${dashboardUrl}" style="display: inline-block; background-color: #2E150C; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: bold; padding: 12px 24px; border-radius: 6px;">Kelola Stok di Dashboard</a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #8C8078;">
          <p style="margin: 0;">Biji Hub Merchant Services</p>
        </div>
      </div>
    `;

    const res = await resend.emails.send({
      from: FROM_EMAIL,
      to: sellerEmail,
      subject: `[Biji Hub] ${isSoldOut ? "STOK HABIS" : "PERINGATAN STOK MENIPIS"}: ${listingTitle}`,
      html: htmlContent,
    });

    return {
      success: true,
      messageId: res.data?.id,
    };
  } catch (error) {
    console.error("Failed to send low stock alert email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}
