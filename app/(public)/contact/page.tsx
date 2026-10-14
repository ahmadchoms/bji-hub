import { PageContainer } from "@/components/layout/page-container";
import { Mail, MessageSquare } from "lucide-react";

export const metadata = {
  title: "Kontak & Bantuan - Biji Hub",
  description: "Hubungi tim operasional dan dukungan marketplace kopi Biji Hub.",
};

export default function KontakPage() {
  return (
    <PageContainer className="max-w-3xl py-10 md:py-14">
      <article className="space-y-6 text-sm leading-relaxed text-neutral-700">
        <h1 className="font-display text-3xl font-bold text-neutral-900 tracking-tight">
          Kontak & Bantuan
        </h1>
        <p>
          Ada pertanyaan seputar pemesanan biji kopi, pembukaan toko, atau kemitraan transaksi partai besar? Kami siap membantu.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-2 shadow-xs">
            <div className="size-8 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center">
              <Mail className="size-4" />
            </div>
            <h2 className="font-bold text-neutral-900 text-sm">Dukungan Email</h2>
            <p className="text-xs text-neutral-500">
              Pertanyaan umum, kendala akun, verifikasi toko mitra, dan kendala escrow.
            </p>
            <a
              href="mailto:halo@bijihub.com"
              className="text-xs font-semibold text-primary-700 hover:underline block pt-1"
            >
              halo@bijihub.com
            </a>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-2 shadow-xs">
            <div className="size-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <MessageSquare className="size-4" />
            </div>
            <h2 className="font-bold text-neutral-900 text-sm">Tanya Penjual Langsung</h2>
            <p className="text-xs text-neutral-500">
              Pertanyaan spesifikasi lot kopi, ketersediaan green beans, atau jadwal sangrai.
            </p>
            <p className="text-xs text-neutral-600 pt-1">
              Gunakan tombol WhatsApp di halaman produk toko terkait.
            </p>
          </div>
        </div>
      </article>
    </PageContainer>
  );
}