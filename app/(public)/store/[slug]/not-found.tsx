import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { Button, buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "cn";

export default function StoreNotFound() {
  return (
    <div className="py-20">
      <PageContainer className="max-w-md mx-auto space-y-4">
        <div className="text-center space-y-3">
          <h2 className="font-display text-2xl text-neutral-900 font-semibold">
            Toko Kopi Tidak Ditemukan
          </h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Profil penjual yang Anda tuju mungkin tidak aktif atau tautan toko
            salah.
          </p>
          <Link
            href="/catalog"
            className={cn(
              buttonVariants({ variant: "primary", size: "md" }),
              "gap-2",
            )}
          >
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
