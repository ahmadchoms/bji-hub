import { PageContainer } from "@/components/layout/page-container";

export default function TentangPage() {
  return (
    <PageContainer className="max-w-3xl py-10 md:py-14">
      <article className="space-y-8 text-sm leading-relaxed text-neutral-700">
        <section>
          <h1 className="font-display text-3xl font-semibold text-neutral-900">Tentang Biji</h1>
          <p className="mt-3">Biji adalah direktori kopi specialty Indonesia untuk petani, roastery, kedai kopi, dan pembeli ritel.</p>
          <p className="mt-2">Produk ditampilkan oleh penjual. Transaksi dilakukan langsung antara pembeli dan penjual di luar platform. Biji tidak mengambil komisi dari transaksi kopi.</p>
        </section>
        <section id="kontak">
          <h2 className="font-display text-xl font-semibold text-neutral-900">Kontak</h2>
          <p className="mt-2">Hubungi penjual melalui WhatsApp pada halaman produk. Untuk pertanyaan platform, gunakan kontak yang tercantum pada akun Biji.</p>
        </section>
        <section id="syarat">
          <h2 className="font-display text-xl font-semibold text-neutral-900">Syarat</h2>
          <p className="mt-2">Penjual bertanggung jawab atas informasi produk, stok, harga, dan pengiriman. Pembeli dan penjual menyepakati transaksi secara langsung.</p>
        </section>
      </article>
    </PageContainer>
  );
}
