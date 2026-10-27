"use client";

import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import { requestVerificationAction } from "@/actions/seller.actions";
import { createKycUploadTargetAction } from "@/actions/upload.actions";
import { validateKycFile } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2, Upload, FileCheck, X } from "lucide-react";

export function RequestVerificationButton({
  disabled,
}: {
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const error = validateKycFile({
      type: selected.type,
      size: selected.size,
    });
    if (error) {
      toast.error(error);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFile(selected);
  };

  const handleClearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRequest = () => {
    startTransition(async () => {
      let kycDocumentPath: string | undefined = undefined;

      if (file) {
        // Step 1: Request signed upload URL to private bucket
        const targetRes = await createKycUploadTargetAction({
          filename: file.name,
          contentType: file.type,
          size: file.size,
        });

        if (!targetRes.success) {
          toast.error(targetRes.error);
          return;
        }

        // Step 2: Upload file directly
        try {
          const uploadRes = await fetch(targetRes.data.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });

          if (!uploadRes.ok) {
            toast.error("Gagal mengunggah dokumen identitas. Silakan coba lagi.");
            return;
          }

          kycDocumentPath = targetRes.data.path;
        } catch {
          toast.error("Terjadi kesalahan jaringan saat mengunggah dokumen.");
          return;
        }
      }

      // Step 3: Submit verification request
      const result = await requestVerificationAction({
        kycDocumentPath,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        "Permohonan verifikasi dan dokumen identitas berhasil dikirim. Tim kami akan meninjau dalam 1-2 hari kerja.",
      );
      handleClearFile();
    });
  };

  return (
    <div className="space-y-3 w-full sm:w-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled || isPending}
        />

        {!file ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || isPending}
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5 text-xs border-dashed border-neutral-300 text-neutral-700 hover:bg-neutral-50"
          >
            <Upload className="h-3.5 w-3.5 text-neutral-500" />
            Lampirkan Dokumen KYC (KTP/NIB/NPWP)
          </Button>
        ) : (
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-neutral-100 border border-neutral-300 rounded text-xs text-neutral-800">
            <FileCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span className="max-w-[180px] truncate">{file.name}</span>
            <button
              type="button"
              onClick={handleClearFile}
              disabled={isPending}
              className="text-neutral-400 hover:text-neutral-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <Button
          onClick={handleRequest}
          disabled={disabled || isPending}
          className="gap-2 bg-primary-600 hover:bg-primary-700 text-white w-full sm:w-auto"
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
      </div>
      <p className="text-[11px] text-neutral-500">
        Format file: PDF, JPG, PNG, atau WebP (maks. 5 MB). Dokumen disimpan di bucket terenkripsi privat.
      </p>
    </div>
  );
}
