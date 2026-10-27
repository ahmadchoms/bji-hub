"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { reviewVerificationAction } from "@/actions/admin.actions";
import { getKycDocumentSignedUrlAction } from "@/actions/upload.actions";
import { Button } from "../ui/button";
import { CheckCircle2, X, FileText, Loader2 } from "lucide-react";

export function VerificationActions({
  sellerId,
  name,
  hasKycDocument,
}: {
  sellerId: string;
  name: string;
  hasKycDocument?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [viewingKyc, setViewingKyc] = useState(false);

  const handleViewKyc = async () => {
    setViewingKyc(true);
    try {
      const res = await getKycDocumentSignedUrlAction(sellerId);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      window.open(res.data.signedUrl, "_blank", "noopener,noreferrer");
    } finally {
      setViewingKyc(false);
    }
  };

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
    <div className="flex items-center gap-1.5 justify-end">
      {hasKycDocument && (
        <Button
          variant="outline"
          size="sm"
          disabled={viewingKyc || pending}
          className="gap-1 text-xs border-neutral-300 text-neutral-700 hover:bg-neutral-100"
          onClick={handleViewKyc}
        >
          {viewingKyc ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileText className="h-3.5 w-3.5 text-primary-600" />
          )}
          Lihat Dokumen KYC
        </Button>
      )}
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
    </div>
  );
}
