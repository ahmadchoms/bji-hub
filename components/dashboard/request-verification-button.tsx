"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { requestVerificationAction } from "@/actions/seller.actions";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2 } from "lucide-react";

export function RequestVerificationButton({
  disabled,
}: {
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleRequest = () => {
    startTransition(async () => {
      const result = await requestVerificationAction();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        "Permohonan verifikasi berhasil dikirim. Tim kami akan meninjau dalam 1-2 hari kerja.",
      );
    });
  };

  return (
    <Button
      onClick={handleRequest}
      disabled={disabled || isPending}
      className="gap-2 bg-primary-600 hover:bg-primary-700 text-white"
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Mengirim Pengajuan...
        </>
      ) : (
        <>
          <ShieldCheck className="h-4 w-4" />
          Ajukan Verifikasi Toko
        </>
      )}
    </Button>
  );
}
