import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, AlertTriangle, FileCheck, CheckCircle2 } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";

export const metadata: Metadata = {
  title: "Kebijakan Klaim Produk & Standar Kopi - Biji Hub",
  description:
    "Standar keaslian, transparansi asal-usul, sertifikasi organik, dan kebijakan klaim produk di Biji Hub.",
  alternates: {
    canonical: "/product-policy",
  },
};

export default function KebijakanProdukPage() {
  return (
    <div className="py-8 md:py-12 bg-neutral-50/50 min-h-screen">
      <PageContainer className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-neutral-200 pb-5">
          <div className="flex items-center gap-2 text-primary-800 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            Integritas & Keaslian Produk
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-neutral-900">
            Kebijakan Klaim Produk & Standar Biji Kopi
          </h1>
          <p className="text-xs text-neutral-600 mt-1 max-w-2xl">
            Biji Hub berkomitmen melindungi pembeli dan mendukung petani serta roastery yang beroperasi dengan jujur. Semua produk yang didaftarkan wajib mematuhi standar transparansi di bawah ini.
          </p>
        </div>

        {/* 1. Larangan Klaim Medis */}
        <div className="border border-neutral-300 rounded-sm bg-surface-base p-6 space-y-3">
          <div className="flex items-center gap-2 text-rose-800 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4" />
            1. Larangan Mutlak Klaim Kesehatan & Medis
          </div>
          <p className="text-xs text-neutral-700 leading-relaxed">
            Kopi adalah produk pangan minuman penyegar. Penjual dilarang keras mengklaim kopi dapat mengobati, menyembuhkan, atau mencegah penyakit medis (seperti diabetes, kanker, stroke, asam urat, atau penyakit kronis lainnya).
          </p>
          <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-900">
            <strong>Konsekuensi:</strong> Listing yang memuat klaim medis akan ditolak atau ditandai untuk peninjauan moderasi segera.
          </div>
        </div>

        {/* 2. Sertifikasi Organik, Fair Trade & Indikasi Geografis */}
        <div className="border border-neutral-300 rounded-sm bg-surface-base p-6 space-y-3">
          <div className="flex items-center gap-2 text-neutral-900 font-semibold text-sm">
            <FileCheck className="w-4 h-4 text-primary-700" />
            2. Klaim Bersertifikat (Organik, Fair Trade, Indikasi Geografis)
          </div>
          <p className="text-xs text-neutral-700 leading-relaxed">
            Klaim seperti &quot;Organik&quot;, &quot;Fair Trade&quot;, atau &quot;Indikasi Geografis (IG)&quot; wajib didukung bukti sertifikat resmi dari lembaga sertifikasi berwenang. Listing dengan klaim tersebut tanpa verifikasi dokumen akan otomatis masuk ke antrean moderasi (<code>needs_review</code>) sebelum lencana verifikasi diberikan.
          </p>
        </div>

        {/* 3. Kesejahteraan Satwa: Kopi Luwak Liar */}
        <div className="border border-neutral-300 rounded-sm bg-surface-base p-6 space-y-3">
          <div className="flex items-center gap-2 text-neutral-900 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            3. Kesejahteraan Satwa & Kebijakan Kopi Luwak
          </div>
          <p className="text-xs text-neutral-700 leading-relaxed">
            Demi menjaga kelestarian alam dan kesejahteraan satwa liar, Biji Hub melarang penjualan kopi dari luwak yang dikurung/diternakkan dalam kandang sempit. Penjualan kopi luwak hanya diizinkan untuk panen liar (100% Wild Luwak) dengan dokumen verifikasi asal panen.
          </p>
        </div>

        {/* 4. Keaslian Tanggal Sangrai & Lot Panen */}
        <div className="border border-neutral-300 rounded-sm bg-surface-base p-6 space-y-3">
          <div className="flex items-center gap-2 text-neutral-900 font-semibold text-sm">
            <ShieldCheck className="w-4 h-4 text-primary-700" />
            4. Keaslian Tanggal Sangrai (Roast Date) & Kode Lot
          </div>
          <p className="text-xs text-neutral-700 leading-relaxed">
            Penjual wajib mencantumkan tanggal sangrai aktual yang sesuai dengan batch sangrai fisik. Manipulasi tanggal sangrai untuk meniru kesegaran palsu merupakan pelanggaran berat integritas pasar.
          </p>
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200 text-xs text-neutral-600">
          <Link href="/privacy" className="hover:text-neutral-900 underline">
            Kebijakan Privasi
          </Link>
          <Link href="/contact" className="hover:text-neutral-900 underline">
            Laporkan Pelanggaran Listing
          </Link>
        </div>
      </PageContainer>
    </div>
  );
}
