import { PageContainer } from "@/components/layout/page-container";

export const metadata = {
  title: "Kebijakan Retur & Pengembalian Dana - Biji Hub",
  description:
    "Prosedur pengajuan retur barang, garansi kualitas kopi, dan ketentuan pengembalian dana (refund) di Biji Hub.",
};

export default function RefundPolicyPage() {
  return (
    <PageContainer className="max-w-3xl py-10 md:py-14">
      <article className="space-y-6 text-sm leading-relaxed text-neutral-700">
        <h1 className="font-display text-3xl font-bold text-neutral-900 tracking-tight">
          Kebijakan Retur & Pengembalian Dana
        </h1>
        <p className="text-xs text-neutral-600">
          Setiap transaksi di Biji Hub dilindungi dengan sistem garansi penerimaan pesanan dan mediasi sengketa resmi.
        </p>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-neutral-900">
            1. Syarat Pengajuan Sengketa & Pengembalian Dana
          </h2>
          <p>
            Pembeli berhak mengajukan pengaduan (dispute) dan permohonan pengembalian dana apabila mengalami salah satu kondisi berikut:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Produk Rusak / Kemasan Robek:</strong> Paket kopi tiba dalam kondisi kemasan terbuka, rusak parah akibat kelalaian kurir/pengemasan, atau terkontaminasi.</li>
            <li><strong>Ketidaksesuaian Pesanan:</strong> Lot kopi yang diterima tidak sesuai dengan varietas, proses pascapanen, profil sangrai, ukuran gilingan, atau berat netto yang dipesan.</li>
            <li><strong>Pesanan Tidak Terkirim:</strong> Penjual tidak memasukkan nomor resi valid dalam 2x24 jam hari kerja, atau paket hilang dalam perjalanan ekspedisi.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-neutral-900">
            2. Batas Waktu & Bukti yang Diperlukan
          </h2>
          <p>
            Pengajuan komplain harus dilakukan maksimal <strong>2x24 jam sejak paket berstatus diterima (delivered)</strong> menurut sistem pelacakan resi, sebelum pesanan otomatis berstatus selesai (completed).
          </p>
          <p>
            Untuk memvalidasi keluhan, pembeli wajib menyertakan:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Foto label resi pengiriman yang tertera jelas pada kardus/kemasan luar.</li>
            <li>Foto detail kondisi kemasan dan fisik biji kopi.</li>
            <li>Video unboxing tanpa jeda (cut) saat paket pertama kali dibuka.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-neutral-900">
            3. Proses Mediasi & Resolusi
          </h2>
          <p>
            Setelah sengketa diajukan melalui sistem pesanan, tim moderasi Biji Hub akan memediasi komunikasi antara pembeli dan penjual dalam 1-2 hari kerja. Resolusi dapat berupa:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Pengembalian Dana Penuh (Full Refund):</strong> Dana pembayaran dikembalikan seutuhnya ke pembeli apabila produk terbukti salah kirim atau cacat total.</li>
            <li><strong>Pengiriman Barang Pengganti:</strong> Penjual mengirimkan ulang produk yang benar tanpa biaya tambahan kepada pembeli.</li>
            <li><strong>Penolakan Sengketa:</strong> Apabila keluhan diajukan tanpa bukti yang valid atau melewati batas waktu garansi.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-neutral-900">
            4. Prosedur Pembatalan Sebelum Dikirim
          </h2>
          <p>
            Pembeli dapat membatalkan pesanan selama status pembayaran masih menunggu (pending payment). Apabila pesanan sudah dibayar namun penjual berhalangan memenuhi stok, penjual atau admin akan membatalkan pesanan dan mengembalikan dana secepatnya.
          </p>
        </section>
      </article>
    </PageContainer>
  );
}
