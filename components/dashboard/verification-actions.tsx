"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { reviewVerificationAction } from "@/actions/admin.actions";

const btn =
  "cursor-pointer text-xs font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-40";

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
      <button
        type="button"
        disabled={pending}
        onClick={() => run("approve")}
        className={`${btn} mr-3 text-status-success`}
      >
        Setujui
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run("reject")}
        className={`${btn} text-status-error`}
      >
        Tolak
      </button>
    </>
  );
}
