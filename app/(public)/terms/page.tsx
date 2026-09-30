import { PageContainer } from "@/components/layout/page-container";

export default function SyaratPage() {
  return (
    <PageContainer className="max-w-3xl py-10 md:py-14">
      <article className="space-y-6 text-sm leading-relaxed text-neutral-700">
        <h1 className="font-display text-3xl font-semibold text-neutral-900">Syarat & Ketentuan</h1>
        <section>
          <h2 className="font-display text-xl font-semibold text-neutral-900">Transaksi</h2>
          <p className="mt-2">Seluruh transaksi kopi dilakukan langsung antara pembeli dan penjual di luar platform. Biji tidak mengambil komisi dari penjualan.</p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-neutral-900">Penjual</h2>
          <p className="mt-2">Penjual bertanggung jawab atas keakuratan informasi produk, ketersediaan stok, harga, dan pengiriman.</p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-neutral-900">Platform</h2>
          <p className="mt-2">Biji berhak menampilkan, memoderasi, atau menghapus listing yang melanggar ketentuan platform.</p>
        </section>
      </article>
    </PageContainer>
  );
}