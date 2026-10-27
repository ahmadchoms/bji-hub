import { PageContainer } from "@/components/layout/page-container";

export const metadata = {
  title: "Kebijakan Privasi - Biji Hub",
  description:
    "Kebijakan privasi perlindungan data pribadi pengguna, pembeli, dan penjual di ekosistem marketplace Biji Hub.",
};

export default function PrivacyPage() {
  return (
    <PageContainer className="max-w-3xl py-10 md:py-14">
      <article className="space-y-6 text-sm leading-relaxed text-neutral-700">
        <h1 className="font-display text-3xl font-bold text-neutral-900 tracking-tight">
          Kebijakan Privasi
        </h1>
        <p className="text-xs text-neutral-500">
          Terakhir diperbarui: Oktober 2026. Berlaku untuk seluruh pengguna platform Biji Hub.
        </p>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-neutral-900">
            1. Data Pribadi yang Kami Kumpulkan
          </h2>
          <p>
            Untuk memfasilitasi transaksi jual-beli kopi berkualitas dan pengiriman pesanan, kami mengumpulkan informasi yang Anda berikan secara langsung:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Data Akun:</strong> Nama lengkap, alamat email, kata sandi terenkripsi, serta preferensi profil.</li>
            <li><strong>Data Transaksi & Pengiriman:</strong> Nama penerima, alamat pengiriman lengkap, nomor telepon aktif, dan catatan pesanan.</li>
            <li><strong>Data Toko / Penjual:</strong> Nama usaha roastery/kebun, kontak WhatsApp, nomor rekening bank (untuk pencairan hasil penjualan), dan dokumen verifikasi legalitas (bila diajukan).</li>
            <li><strong>Data Log & Teknis:</strong> Alamat IP, identitas sesi, dan riwayat aktivitas transaksi guna pencegahan penipuan serta audit sistem.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-neutral-900">
            2. Tujuan Pemrosesan Data
          </h2>
          <p>
            Data pribadi Anda diproses secara sah berdasarkan persetujuan dan kebutuhan pemenuhan transaksi:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Memproses verifikasi akun, login aman, dan otentikasi sesi.</li>
            <li>Memfasilitasi pembuatan pesanan, pembayaran bergaransi, dan pengiriman paket kopi oleh kurir.</li>
            <li>Mengirimkan email notifikasi transaksional (status pembayaran, nomor resi kurir, dan penyelesaian order).</li>
            <li>Mencegah penipuan transaksi, over-selling stok, dan melindungi hak pembeli serta penjual.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-neutral-900">
            3. Pembagian Data ke Pihak Ketiga Terpercaya
          </h2>
          <p>
            Biji Hub tidak pernah menjual data pribadi Anda kepada pihak mana pun. Kami hanya meneruskan data ke mitra penyedia infrastruktur yang terikat perjanjian kerahasiaan:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase:</strong> Penyedia basis data terenkripsi dan layanan otentikasi identitas.</li>
            <li><strong>Midtrans:</strong> Gateway pembayaran berlisensi Bank Indonesia untuk memproses transaksi perbankan, VA, QRIS, dan e-wallet.</li>
            <li><strong>Ekspedisi Kurir (JNE, POS, J&T, SiCepat):</strong> Penyedia logistik yang menerima nama, alamat tujuan, dan telepon penerima guna pengantaran barang.</li>
            <li><strong>Resend:</strong> Layanan pengiriman email transaksional resmi Biji Hub.</li>
            <li><strong>Google Identity Services:</strong> Penyedia Single Sign-On jika Anda memilih login dengan Google.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-neutral-900">
            4. Retensi dan Keamanan Data
          </h2>
          <p>
            Kami menerapkan enkripsi standar industri (SSL/TLS saat transit dan hashing kriptografis saat istirahat) serta kontrol akses ketat berbasis peran (Role-Based Access Control). Riwayat transaksi keuangan disimpan sesuai ketentuan regulasi perdagangan elektronik dan perpajakan di Indonesia.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-neutral-900">
            5. Hak Pengguna (Sesuai UU Perlindungan Data Pribadi)
          </h2>
          <p>
            Anda memiliki hak untuk mengakses profil Anda, memperbarui data yang keliru, mengunduh salinan riwayat, menarik persetujuan pemrosesan data non-esensial, atau meminta penonaktifan akun dengan menghubungi tim kami.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-neutral-900">
            6. Hubungi Kami
          </h2>
          <p>
            Apabila Anda memiliki pertanyaan atau kendala terkait privasi data Anda, silakan hubungi tim dukungan kami melalui halaman <a href="/contact" className="text-primary-600 underline">Kontak</a> atau email ke <code>privacy@bijihub.com</code>.
          </p>
        </section>
      </article>
    </PageContainer>
  );
}
