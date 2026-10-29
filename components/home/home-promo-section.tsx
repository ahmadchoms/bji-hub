import { PageContainer } from "@/components/layout/page-container";
import { TasteQuizModal } from "@/components/catalog/taste-quiz-modal";

export function HomePromoSection() {
  return (
    <section className="py-4 border-b border-neutral-200 bg-white">
      <PageContainer>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
          {/* Promo Banner Card */}
          <div className="md:col-span-8 rounded-xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-primary-950 text-white p-5 sm:p-6 flex flex-col justify-between shadow-xs">
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
                Bursa Kopi Specialty Nusantara
              </h1>
              <p className="text-xs sm:text-sm text-neutral-300 max-w-xl leading-relaxed">
                Beli biji mentah (green beans) & sangrai langsung dari petani, koperasi, dan roastery lokal. Transaksi aman & terjamin, cupping score transparan, dan negosiasi grosir B2B.
              </p>
            </div>

            <div className="pt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-300">
              <span className="bg-white/10 px-2 py-0.5 rounded font-mono">100% Kopi Nusantara</span>
              <span className="bg-white/10 px-2 py-0.5 rounded font-mono">Beli Grosir & Sampel</span>
              <span className="bg-white/10 px-2 py-0.5 rounded font-mono">Garansi Pengiriman</span>
            </div>
          </div>

          {/* Smart Helper Quiz Card */}
          <div className="md:col-span-4 rounded-xl border border-neutral-200/90 bg-neutral-50/80 p-5 flex flex-col justify-between text-neutral-800 shadow-xs">
            <div className="space-y-1.5">
              <p className="text-xs font-bold font-display uppercase tracking-wider text-neutral-900">
                Cari Rasa yang Pas?
              </p>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Pilih metode seduhmu (Filter, Espresso, Tubruk) untuk rekomendasi biji kopi dengan karakter rasa yang cocok.
              </p>
            </div>

            <div className="pt-3">
              <TasteQuizModal triggerVariant="banner" className="w-full" />
            </div>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
