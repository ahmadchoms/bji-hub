export type Locale = "id" | "en";
export const COOKIE_LOCALE = "NEXT_LOCALE";

export const DICTIONARIES = {
  id: {
    // Navbar
    "nav.catalog": "Katalog Kopi",
    "nav.producers": "Petani & Prosesor",
    "nav.origins": "Asal Kopi",
    "nav.learn": "Pusat Belajar",
    "nav.cart": "Keranjang",
    "nav.orders": "Pesanan Saya",
    "nav.messages": "Pesan",
    "nav.login": "Masuk Akun",
    "nav.register": "Daftar",
    "nav.myStore": "Toko Saya",
    "nav.openStore": "Buka Toko",
    "nav.logout": "Keluar",

    // Catalog & Filters
    "catalog.title": "Katalog Biji Kopi Indonesia",
    "catalog.subtitle": "Beli biji kopi segar langsung dari roastery lokal dan petani terverifikasi.",
    "catalog.searchPlaceholder": "Cari nama kopi, daerah, varietas, atau proses...",
    "catalog.filterRegion": "Asal Daerah",
    "catalog.filterProcess": "Metode Pasca-Panen",
    "catalog.filterRoast": "Tingkat Sangrai",
    "catalog.filterPrice": "Rentang Harga",
    "catalog.freshness": "Tingkat Kesegaran",
    "catalog.empty": "Tidak ada biji kopi yang cocok dengan filter yang dipilih.",
    "catalog.reset": "Atur Ulang Filter",

    // Product detail
    "product.roastDate": "Tanggal Sangrai",
    "product.freshDays": "hari sejak sangrai",
    "product.cuppingScore": "Skor Cupping",
    "product.flavorNotes": "Catatan Rasa",
    "product.process": "Proses",
    "product.altitude": "Ketinggian",
    "product.variety": "Varietas",
    "product.producer": "Petani / Produser",
    "product.minOrder": "Minimal Order",
    "product.stock": "Stok Tersedia",
    "product.addToCart": "Tambah ke Keranjang",
    "product.buyNow": "Beli Sekarang",
    "product.chatSeller": "Chat Penjual",

    // Cart & Checkout
    "cart.title": "Keranjang Belanja",
    "cart.empty": "Keranjang belanja Anda masih kosong.",
    "cart.checkout": "Lanjut ke Pembayaran",
    "checkout.title": "Pembayaran & Pengiriman",
    "checkout.recipient": "Alamat Pengiriman",
    "checkout.shippingCourier": "Opsi Kurir Pengiriman",
    "checkout.voucherCode": "Punya Kode Voucher?",
    "checkout.applyVoucher": "Pakai",
    "checkout.removeVoucher": "Hapus",
    "checkout.subtotal": "Subtotal Produk",
    "checkout.shippingCost": "Ongkos Kirim",
    "checkout.serviceFee": "Biaya Layanan Platform",
    "checkout.discount": "Diskon Voucher",
    "checkout.total": "Total Pembayaran",
    "checkout.payNow": "Bayar Sekarang",
    "checkout.billingNotice": "Semua pembayaran ditagih dalam mata uang IDR (Rupiah).",

    // Orders & Status
    "order.status.pending": "Menunggu Pembayaran",
    "order.status.paid": "Sudah Dibayar",
    "order.status.shipped": "Dalam Pengiriman",
    "order.status.completed": "Selesai",
    "order.status.canceled": "Dibatalkan",
    "order.status.disputed": "Dalam Komplain",
    "order.reorder": "Beli Lagi",
    "order.invoice": "Cetak Invoice",
    "order.chat": "Chat Penjual",

    // Footer
    "footer.tagline": "Platform pasar biji kopi nusantara langsung dari petani dan roastery independen.",
    "footer.privacy": "Kebijakan Privasi",
    "footer.terms": "Syarat & Ketentuan",
    "footer.contact": "Hubungi Kami",
  },
  en: {
    // Navbar
    "nav.catalog": "Coffee Catalog",
    "nav.producers": "Farmers & Processors",
    "nav.origins": "Coffee Origins",
    "nav.learn": "Learning Center",
    "nav.cart": "Cart",
    "nav.orders": "My Orders",
    "nav.messages": "Messages",
    "nav.login": "Sign In",
    "nav.register": "Sign Up",
    "nav.myStore": "My Store",
    "nav.openStore": "Open Store",
    "nav.logout": "Sign Out",

    // Catalog & Filters
    "catalog.title": "Indonesian Specialty Coffee Catalog",
    "catalog.subtitle": "Fresh coffee beans directly from local roasteries and verified origin farmers.",
    "catalog.searchPlaceholder": "Search coffee, origin region, variety, or process...",
    "catalog.filterRegion": "Origin Region",
    "catalog.filterProcess": "Process Method",
    "catalog.filterRoast": "Roast Level",
    "catalog.filterPrice": "Price Range",
    "catalog.freshness": "Freshness Level",
    "catalog.empty": "No specialty coffees found matching your selected filters.",
    "catalog.reset": "Reset Filters",

    // Product detail
    "product.roastDate": "Roast Date",
    "product.freshDays": "days since roasted",
    "product.cuppingScore": "Cupping Score",
    "product.flavorNotes": "Flavor Notes",
    "product.process": "Process Method",
    "product.altitude": "Altitude",
    "product.variety": "Varieties",
    "product.producer": "Farmer / Producer",
    "product.minOrder": "Min. Order",
    "product.stock": "Available Stock",
    "product.addToCart": "Add to Cart",
    "product.buyNow": "Buy Now",
    "product.chatSeller": "Message Seller",

    // Cart & Checkout
    "cart.title": "Shopping Cart",
    "cart.empty": "Your shopping cart is currently empty.",
    "cart.checkout": "Proceed to Checkout",
    "checkout.title": "Checkout & Delivery",
    "checkout.recipient": "Shipping Address",
    "checkout.shippingCourier": "Courier Delivery Options",
    "checkout.voucherCode": "Have a Voucher Code?",
    "checkout.applyVoucher": "Apply",
    "checkout.removeVoucher": "Remove",
    "checkout.subtotal": "Items Subtotal",
    "checkout.shippingCost": "Shipping Cost",
    "checkout.serviceFee": "Platform Service Fee",
    "checkout.discount": "Voucher Discount",
    "checkout.total": "Total Amount",
    "checkout.payNow": "Pay Now",
    "checkout.billingNotice": "All transactions are billed in IDR (Indonesian Rupiah).",

    // Orders & Status
    "order.status.pending": "Awaiting Payment",
    "order.status.paid": "Payment Confirmed",
    "order.status.shipped": "Shipped in Transit",
    "order.status.completed": "Completed",
    "order.status.canceled": "Canceled",
    "order.status.disputed": "Disputed",
    "order.reorder": "Order Again",
    "order.invoice": "View Invoice",
    "order.chat": "Chat Seller",

    // Footer
    "footer.tagline": "Direct Indonesian specialty coffee marketplace from verified producers and roasteries.",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Service",
    "footer.contact": "Contact Us",
  },
} as const;

export type TranslationKey = keyof typeof DICTIONARIES.id;

export function t(key: TranslationKey, locale: Locale = "id"): string {
  const dict = DICTIONARIES[locale] || DICTIONARIES.id;
  return dict[key] || DICTIONARIES.id[key] || key;
}

export interface CurrencyRateData {
  code: string;
  perIdr: number;
}

export const DEFAULT_CURRENCY_RATES: Record<string, number> = {
  USD: 0.000063, // 1 USD ≈ Rp 15,873
  EUR: 0.000059, // 1 EUR ≈ Rp 16,949
  SGD: 0.000084, // 1 SGD ≈ Rp 11,904
  JPY: 0.0095,   // 1 JPY ≈ Rp 105
  AUD: 0.000097, // 1 AUD ≈ Rp 10,309
};

export function formatEstimatedPrice(
  amountIdr: number,
  targetCurrency = "USD",
  rate = DEFAULT_CURRENCY_RATES.USD,
): {
  idrText: string;
  estimatedText: string;
  combinedText: string;
  disclaimer: string;
} {
  const idrFormatted = `Rp ${Math.round(amountIdr).toLocaleString("id-ID")}`;
  const converted = amountIdr * rate;

  let currencySymbol = "$";
  if (targetCurrency === "EUR") currencySymbol = "€";
  else if (targetCurrency === "JPY") currencySymbol = "¥";
  else if (targetCurrency === "SGD") currencySymbol = "S$";
  else if (targetCurrency === "AUD") currencySymbol = "A$";

  const formattedConverted =
    targetCurrency === "JPY"
      ? `${currencySymbol} ${Math.round(converted).toLocaleString("en-US")}`
      : `${currencySymbol} ${converted.toFixed(2)}`;

  const estimatedText = `≈ ${formattedConverted}`;
  const combinedText = `${idrFormatted} (${estimatedText})`;
  const disclaimer = "Estimasi tampilan. Pembayaran tetap ditagih dalam IDR.";

  return {
    idrText: idrFormatted,
    estimatedText,
    combinedText,
    disclaimer,
  };
}
