import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
  const tiers = [
    {
      tier: "free",
      name: "Free (Pemula)",
      price: "Rp 0",
      listings: "Maks. 3 listing",
      verified: "—",
      analytics: "—",
      boost: "—",
      priority: "Dasar",
      cta: "/register?tier=free",
    },
    {
      tier: "growth",
      name: "Growth (Roastery)",
      price: "Rp 79.000",
      listings: "Hingga 15 listing",
      verified: "Badge Terverifikasi",
      analytics: "Dasar (view & klik)",
      boost: "1x/bulan gratis",
      priority: "Tinggi",
      cta: "/register?tier=growth",
    },
    {
      tier: "business",
      name: "Business (Koperasi)",
      price: "Rp 149.000",
      listings: "Unlimited",
      verified: "Badge Resmi",
      analytics: "Lengkap + RFQ",
      boost: "2x/bulan gratis",
      priority: "Tertinggi",
      cta: "/register?tier=business",
    },
  ];

  const features = [
    { label: "Listing Produk", key: "listings" as const },
    { label: "Badge Terverifikasi", key: "verified" as const },
    { label: "Analitik", key: "analytics" as const },
    { label: "Boost Listing", key: "boost" as const },
    { label: "Prioritas Pencarian", key: "priority" as const },
  ];

  const faqs = [
    { q: "Apakah platform Biji memotong persentase dari penjualan kopi saya?", a: "Sama sekali tidak. Biji adalah direktori murni tanpa payment gateway. Seluruh pembayaran dilakukan langsung antara Anda dan pembeli." },
    { q: "Untuk apa biaya langganan ini?", a: "Biaya langganan membiayai operasional platform, verifikasi legalitas kebun/roaster, serta pemasaran untuk mendatangkan penikmat kopi dan pemilik kafe ke listing Anda." },
    { q: "Apa itu Listing Boost?", a: "Fitur sorotan yang menempatkan produk Anda di posisi teratas katalog. Harga: Rp 25.000 (7 hari), Rp 45.000 (14 hari), Rp 75.000 (30 hari)." },
    { q: "Bagaimana cara pembayaran langganan?", a: "Melalui QRIS, Virtual Account, atau Transfer Bank. Dapat dibatalkan kapan saja." },
  ];

  return (
    <div className="py-8 md:py-12 space-y-16">
      <PageContainer className="space-y-12">
        {/* Header */}
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl md:text-4xl text-neutral-900 tracking-tight font-semibold">
            Skema Langganan
          </h1>
          <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
            Pilih paket sesuai kapasitas produksi kebun atau roastery Anda. Tanpa komisi transaksi, batalkan kapan saja.
          </p>
        </div>

        {/* Comparison Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-300">
                <th className="text-left py-3 pr-4 text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Fitur</th>
                {tiers.map((t) => (
                  <th key={t.tier} className="text-left py-3 px-4 text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-neutral-300">
                <td className="py-3 pr-4 text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Harga / bulan</td>
                {tiers.map((t) => (
                  <td key={t.tier} className="py-3 px-4 font-mono font-bold text-primary-900">
                    {t.price}
                  </td>
                ))}
              </tr>
              {features.map((f) => (
                <tr key={f.key} className="border-b border-neutral-200">
                  <td className="py-3 pr-4 text-xs text-neutral-700">{f.label}</td>
                  {tiers.map((t) => (
                    <td key={t.tier} className="py-3 px-4 text-xs text-neutral-700">
                      {t[f.key]}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="py-4"></td>
                {tiers.map((t) => (
                  <td key={t.tier} className="py-4 px-4">
                    <Link href={t.cta}>
                      <Button variant={t.tier === "growth" ? "primary" : "secondary"} size="sm">
                        {t.tier === "free" ? "Mulai Gratis" : t.tier === "growth" ? "Pilih Growth" : "Pilih Business"}
                      </Button>
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Add-on Boost */}
        <div className="border border-neutral-300 rounded-sm p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h3 className="font-display text-xl font-semibold text-neutral-900">
                Boost Listing Satuan
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Punya panen baru? Tampilkan lot kopi di urutan teratas katalog tanpa upgrade paket.
                Harga mulai <strong className="font-mono">Rp 25.000 / 7 hari</strong>.
              </p>
            </div>
            <Link href="/register" className="shrink-0">
              <Button variant="primary" size="lg">Buka Toko & Coba Boost</Button>
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl space-y-6">
          <h2 className="font-display text-xl text-neutral-900 font-semibold pb-3 border-b border-neutral-300">
            Pertanyaan Umum
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="space-y-1">
                <h4 className="text-sm font-semibold text-neutral-900">{faq.q}</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}