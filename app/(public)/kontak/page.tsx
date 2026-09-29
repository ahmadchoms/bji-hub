import { PageContainer } from "@/components/layout/page-container";

export default function KontakPage() {
  return (
    <PageContainer className="max-w-3xl py-10 md:py-14">
      <article className="space-y-6 text-sm leading-relaxed text-neutral-700">
        <h1 className="font-display text-3xl font-semibold text-neutral-900">Kontak</h1>
        <p>Hubungi penjual melalui WhatsApp pada halaman produk. Untuk pertanyaan seputar platform Biji, silakan hubungi melalui email: <a href="mailto:halo@biji.id" className="text-primary-600 hover:underline">halo@biji.id</a></p>
      </article>
    </PageContainer>
  );
}