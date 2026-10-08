"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { reviewVerificationAction } from "@/actions/admin.actions";
import { Button } from "../ui/button";
import { CheckCircle2, X } from "lucide-react";

export function VerificationActions({
  sellerId,
  name,
}: {
  sellerId: string;
  name: string;
}) {
  const [pending, startTransition] = useTransition();

  const run = (decision: "approve" | "reject") =>
    startTransition(async () => {
      const result = await reviewVerificationAction(sellerId, decision);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      if (decision === "approve")
        toast.success(`Seller "${name}" berhasil diverifikasi.`);
      else toast.error(`Pengajuan verifikasi "${name}" ditolak.`);
    });

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        className="gap-1 text-status-success hover:bg-green-50 hover:text-green-600"
        onClick={() => run("approve")}
      >
        <CheckCircle2 className="h-3.5 w-3.5" /> Setujui
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        className="gap-1 text-status-error hover:bg-red-50 hover:text-red-600"
        onClick={() => run("reject")}
      >
        <X className="h-3.5 w-3.5" /> Tolak
      </Button>
    </>
  );
}
