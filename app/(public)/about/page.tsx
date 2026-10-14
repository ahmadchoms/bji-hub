import { PageContainer } from "@/components/layout/page-container";

export const metadata = {
  title: "Tentang Biji Hub - Marketplace Kopi Specialty Nusantara",
  description:
    "Mengenal Biji Hub, platform bursa kopi specialty Indonesia yang menghubungkan petani, prosesor, roastery, dan penikmat kopi seduh.",
};

export default function TentangPage() {
  return (
    <PageContainer className="max-w-3xl py-10 md:py-14">
      <article className="space-y-8 text-sm leading-relaxed text-neutral-700">
        <section className="space-y-3">
          <h1 className="font-display text-3xl font-bold text-neutral-900 tracking-tight">
            Tentang Biji Hub
          </h1>
          <p>
            Biji Hub adalah marketplace dan bursa kopi specialty Indonesia yang menghubungkan petani, koperasi, prosesor, roastery, kedai kopi, hingga penikmat seduh rumahan di seluruh Nusantara.
          </p>
          <p>
            Kami hadir untuk memotong rantai distribusi yang berbelit dan memastikan petani mendapatkan nilai yang adil, serta roastery mendapatkan akses biji mentah (green beans) dan roasted beans berkualitas dengan data cupping SCA yang transparan.
          </p>
        </section>

        <section id="keamanan" className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-neutral-900">
            Keamanan Transaksi & Rekening Bersama (Escrow)
          </h2>
          <p>
            Semua transaksi ritel di Biji Hub dilindungi oleh sistem Rekening Bersama Escrow. Dana pembeli ditahan dengan aman dan baru dicairkan ke penjual setelah paket kopi diterima dengan baik dan terverifikasi nomor resi pengirimannya.
          </p>
        </section>

        <section id="b2b" className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-neutral-900">
            Penjualan Partai Grosir & Permintaan Sampel B2B
          </h2>
          <p>
            Untuk kebutuhan kafe dan roastery dengan volume besar, Biji Hub menyediakan fitur penawaran harga grosir bertingkat, permintaan sampel green beans, serta lembar spesifikasi cupping resmi yang dapat diunduh langsung.
          </p>
        </section>

        <section id="kontak" className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-neutral-900">
            Kontak & Dukungan
          </h2>
          <p>
            Untuk pertanyaan operasional atau bantuan kendala pesanan, hubungi tim kami melalui email resmi di{" "}
            <a href="mailto:halo@bijihub.com" className="text-primary-700 font-medium hover:underline">
              halo@bijihub.com
            </a>
            .
          </p>
        </section>
      </article>
    </PageContainer>
  );
}
