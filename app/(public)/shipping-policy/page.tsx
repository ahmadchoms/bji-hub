import { PageContainer } from "@/components/layout/page-container";

export const metadata = {
  title: "Kebijakan Pengiriman - Biji Hub",
  description:
    "Ketentuan pengemasan kopi, batas waktu pengiriman roastery, tarif ongkos kirim, dan pelacakan resi kurir di Biji Hub.",
};

export default function ShippingPolicyPage() {
  return (
    <PageContainer className="max-w-3xl py-10 md:py-14">
      <article className="space-y-6 text-sm leading-relaxed text-neutral-700">
        <h1 className="font-display text-3xl font-bold text-neutral-900 tracking-tight">
          Kebijakan Pengiriman
        </h1>
        <p className="text-xs text-neutral-600">
          Standar operasional pengemasan dan logistik kopi spesialti dari roastery mitra Biji Hub ke alamat Anda.
        </p>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-neutral-900">
            1. Waktu Pemrosesan Pesanan
          </h2>
          <p>
            Untuk menjamin kesegaran sangrai (fresh roast), pesanan diproses langsung oleh masing-masing roastery atau prosesor kopi:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Penjual wajib mengonfirmasi ketersediaan dan menyiapkan pesanan maksimal <strong>1x24 jam kerja</strong> setelah pembayaran terverifikasi.</li>
            <li>Paket diserahkan ke jasa ekspedisi dan nomor resi pengiriman dimasukkan ke sistem dalam waktu maksimal <strong>2x24 jam kerja</strong>.</li>
            <li>Hari kerja operasional pengiriman adalah Senin hingga Sabtu (tidak termasuk hari libur nasional atau kebijakan khusus kurir setempat).</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-neutral-900">
            2. Mitra Ekspedisi & Penghitungan Ongkir
          </h2>
          <p>
            Biji Hub terintegrasi dengan penyedia tarif resmi dari berbagai ekspedisi nasional, termasuk:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Jalur Nugraha Ekakurir (JNE):</strong> Layanan Reguler (REG) dan Cepat (YES).</li>
            <li><strong>POS Indonesia:</strong> Layanan Kilat Khusus dan Express.</li>
            <li><strong>Mitra Ekspedisi Lainnya:</strong> SiCepat, J&T, TiKi sesuai wilayah asal roastery mitra.</li>
          </ul>
          <p>
            Biaya pengiriman dihitung otomatis berdasarkan berat paket gabungan (berat kopi + kemasan pelindung) dan jarak kota asal toko ke kota tujuan pembeli.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-neutral-900">
            3. Standar Pengemasan (Packaging)
          </h2>
          <p>
            Semua penjual di Biji Hub diwajibkan memenuhi standar pengemasan kopi yang aman dari kelembapan dan bau asing:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Menggunakan kantong kopi dengan valve satu arah (one-way degassing valve) dan ziplock kedap udara.</li>
            <li>Lapisan pelindung bubble wrap dan kardus tebal untuk pengiriman antar pulau.</li>
            <li>Menyertakan stiker informasi sangrai (roast date, varietas, proses, dan rekomendasi resting).</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-neutral-900">
            4. Pelacakan Pesanan & Status Otomatis
          </h2>
          <p>
            Setelah penjual memasukkan nomor resi, pembeli dapat melacak pergerakan paket secara langsung melalui halaman <strong>Pesanan Saya</strong> atau fitur <strong>Lacak Paket</strong>. Sistem akan otomatis menandai pesanan selesai dalam 2x24 jam setelah resi kurir terkonfirmasi terkirim (delivered), kecuali jika ada pengaduan aktif.
          </p>
        </section>
      </article>
    </PageContainer>
  );
}
