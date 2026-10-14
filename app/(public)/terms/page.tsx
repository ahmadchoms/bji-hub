import { PageContainer } from "@/components/layout/page-container";

export const metadata = {
  title: "Syarat & Ketentuan - Biji Hub",
  description:
    "Syarat dan ketentuan bertransaksi, perlindungan escrow, dan ketentuan toko di marketplace Biji Hub.",
};

export default function SyaratPage() {
  return (
    <PageContainer className="max-w-3xl py-10 md:py-14">
      <article className="space-y-6 text-sm leading-relaxed text-neutral-700">
        <h1 className="font-display text-3xl font-bold text-neutral-900 tracking-tight">
          Syarat & Ketentuan
        </h1>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-neutral-900">
            1. Transaksi & Pembayaran Escrow
          </h2>
          <p>
            Setiap transaksi pembelian produk melalui Biji Hub dilindungi oleh Rekening Bersama Escrow. Pembayaran ditampung di rekening penampung resmi sampai pesanan diterima oleh pembeli. Penjual akan menerima pencairan dana setelah pembeli melakukan konfirmasi penerimaan atau otomatis 2x24 jam setelah resi kurir terkonfirmasi terkirim.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-neutral-900">
            2. Kewajiban Penjual
          </h2>
          <p>
            Penjual bertanggung jawab penuh atas kebenaran spesifikasi lot kopi (varietas, asal daerah, proses pascapanen, tingkat sangrai, dan skor cupping). Penjual wajib mengirimkan barang dengan nomor resi valid maksimal 2x24 jam hari kerja setelah pesanan terbayar.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-neutral-900">
            3. Pengaduan & Retur
          </h2>
          <p>
            Pembeli berhak mengajukan pengaduan apabila pesanan yang diterima rusak, tidak sesuai pesanan, atau tidak terkirim sebelum batas waktu konfirmasi otomatis berakhir. Tim Biji Hub akan memediasi pencairan atau pengembalian dana (refund).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-neutral-900">
            4. Kebijakan Konten & Moderasi
          </h2>
          <p>
            Biji Hub berhak meninjau, menonaktifkan, atau menghapus listing produk dan akun penjual yang melanggar hukum, melakukan penipuan data cupping, atau merugikan ekosistem kopi nusantara.
          </p>
        </section>
      </article>
    </PageContainer>
  );
}