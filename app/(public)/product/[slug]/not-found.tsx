import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ProductNotFound() {
  return (
    <div className="py-20">
      <PageContainer className="max-w-md mx-auto space-y-4">
        <div className="text-center space-y-3">
          <h2 className="font-display text-2xl text-neutral-900 font-semibold">
            Produk Kopi Tidak Ditemukan
          </h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Listing kopi yang Anda cari mungkin telah dinonaktifkan atau tautan yang Anda masukkan salah.
          </p>
          <Link href="/catalog">
            <Button variant="primary" size="md" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Katalog</span>
            </Button>
          </Link>
        </div>
      </PageContainer>
    </div>
  );
}