import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { buttonVariants } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BOOST_FAQ_ANSWER, describePlan, PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { getSession } from "@/lib/auth/session";

export default async function PricingPage() {
  const { role } = await getSession();
  const tiers = PLANS.map(describePlan).map((t) =>
    role === "seller" ? { ...t, cta: "/dashboard/billing" } : t,
  );

  const features = [
    { label: "Listing Produk", key: "listings" as const },
    { label: "Badge Terverifikasi", key: "verified" as const },
    { label: "Analitik", key: "analytics" as const },
    { label: "Boost Listing", key: "boost" as const },
    { label: "Prioritas Pencarian", key: "priority" as const },
  ];

  const faqs = [
    {
      q: "Apakah platform Biji memotong persentase dari penjualan kopi saya?",
      a: "Sama sekali tidak. Biji adalah direktori murni tanpa payment gateway. Seluruh pembayaran dilakukan langsung antara Anda dan pembeli.",
    },
    {
      q: "Untuk apa biaya langganan ini?",
      a: "Biaya langganan membiayai operasional platform, verifikasi legalitas kebun/roaster, serta pemasaran untuk mendatangkan penikmat kopi dan pemilik kafe ke listing Anda.",
    },
    { q: "Apa itu Listing Boost?", a: BOOST_FAQ_ANSWER },
    {
      q: "Bagaimana cara pembayaran langganan?",
      a: "Melalui QRIS, Virtual Account, atau Transfer Bank. Dapat dibatalkan kapan saja.",
    },
  ];

  return (
    <div className="py-8 md:py-12 space-y-16">
      <PageContainer className="space-y-12">
        <div className="max-w-2xl space-y-2">
          <h1 className="font-display text-3xl md:text-4xl text-neutral-900 tracking-tight font-semibold">
            Skema Langganan
          </h1>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Pilih paket sesuai kapasitas produksi kebun atau roastery Anda.
            Tanpa komisi transaksi, batalkan kapan saja.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-neutral-200/80 bg-surface-base shadow-xs">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/50">
                <th className="text-left py-3.5 px-4 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Fitur
                </th>
                {tiers.map((t) => (
                  <th
                    key={t.tier}
                    className="text-left py-3.5 px-4 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-2">
                      <span>{t.name}</span>
                      {t.tier === "growth" && (
                        <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[9px] font-bold text-primary-700 uppercase">
                          Populer
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-neutral-200/80">
                <td className="py-3.5 px-4 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Harga / bulan
                </td>
                {tiers.map((t) => (
                  <td
                    key={t.tier}
                    className="py-3.5 px-4 font-mono font-bold text-base text-primary-900"
                  >
                    {t.price}
                  </td>
                ))}
              </tr>
              {features.map((f) => (
                <tr
                  key={f.key}
                  className="border-b border-neutral-100 hover:bg-neutral-50/40 transition-colors"
                >
                  <td className="py-3 px-4 text-xs font-medium text-neutral-700">
                    {f.label}
                  </td>
                  {tiers.map((t) => (
                    <td
                      key={t.tier}
                      className="py-3 px-4 text-xs text-neutral-600"
                    >
                      {t[f.key]}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="py-5 px-4"></td>
                {tiers.map((t) => (
                  <td key={t.tier} className="py-5 px-4">
                    <Link
                      href={t.cta}
                      className={cn(
                        buttonVariants({
                          variant: t.tier === "growth" ? "primary" : "outline",
                          size: "sm",
                        }),
                        "w-full justify-center shadow-2xs",
                      )}
                    >
                      {t.tier === "free"
                        ? "Mulai Gratis"
                        : t.tier === "growth"
                          ? "Pilih Growth"
                          : "Pilih Business"}
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="border border-neutral-200/80 rounded-xl bg-surface-base p-6 md:p-8 shadow-xs hover:border-neutral-300 transition-all">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <h3 className="font-display text-lg font-semibold text-neutral-900">
                Boost Listing Satuan
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed max-w-2xl">
                Punya panen baru? Tampilkan lot kopi sebagai iklan di hasil
                pencarian yang cocok, tanpa upgrade paket. Harga mulai{" "}
                <strong className="font-mono text-neutral-900 font-semibold">
                  Rp 25.000 / 7 hari
                </strong>
                .
              </p>
            </div>
            <Link
              href="/register?role=seller"
              className={cn(
                buttonVariants({ variant: "primary", size: "md" }),
                "shrink-0 w-full md:w-auto justify-center shadow-xs",
              )}
            >
              Buka Toko & Coba Boost
            </Link>
          </div>
        </div>

        <div className="max-w-2xl space-y-4">
          <div className="border-b border-neutral-200 pb-3">
            <h2 className="font-display text-xl text-neutral-900 font-semibold">
              Pertanyaan Umum
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Segala hal yang perlu Anda ketahui tentang keanggotaan Biji.
            </p>
          </div>

          <Accordion className="w-full">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`}>
                <AccordionTrigger className="text-xs md:text-sm font-semibold text-neutral-800 hover:text-neutral-900">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-neutral-600 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </PageContainer>
    </div>
  );
}
