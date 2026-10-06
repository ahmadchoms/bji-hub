"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uploadImage } from "@/lib/upload-client";
import {
  IMAGE_RULES,
  MAX_RAW_IMAGE_BYTES,
  partitionImageFiles,
  type UploadedImage,
} from "@/lib/storage";

interface ImageUploaderProps {
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  onBusyChange?: (busy: boolean) => void;
  error?: string;
  disabled?: boolean;
}

interface PendingUpload {
  key: string;
  name: string;
  preview: string;
  error: string | null;
}

const linkButton =
  "min-h-11 text-xs font-medium text-neutral-700 hover:underline disabled:opacity-40";

export function ImageUploader({
  value,
  onChange,
  onBusyChange,
  error,
  disabled,
}: ImageUploaderProps) {
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const current = useRef(value);
  current.current = value;

  const busy = uploads.some((u) => u.error === null);
  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  const previews = useRef<string[]>([]);
  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const slotsLeft = IMAGE_RULES.maxCount - value.length - uploads.length;

  const startUpload = async (file: File) => {
    const key = crypto.randomUUID();
    const preview = URL.createObjectURL(file);
    previews.current.push(preview);
    setUploads((prev) => [
      ...prev,
      { key, name: file.name, preview, error: null },
    ]);

    try {
      const image = await uploadImage(file);
      onChange([...current.current, image]);
      current.current = [...current.current, image];
      setUploads((prev) => prev.filter((u) => u.key !== key));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unggah gagal. Coba lagi.";
      setUploads((prev) =>
        prev.map((u) => (u.key === key ? { ...u, error: message } : u)),
      );
    }
  };

  const onFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    setNotice(null);

    const { accepted, rejected } = partitionImageFiles(files, slotsLeft);
    if (rejected.length > 0) setNotice(rejected.join(". "));
    accepted.forEach((file) => void startUpload(file));
  };

  const remove = (index: number) =>
    onChange(value.filter((_, i) => i !== index));
  const makeCover = (index: number) =>
    onChange([value[index], ...value.filter((_, i) => i !== index)]);
  const dismiss = (key: string) =>
    setUploads((prev) => prev.filter((u) => u.key !== key));

  const problem = error ?? notice;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <input
          id="listing-images"
          type="file"
          multiple
          accept={IMAGE_RULES.types.join(",")}
          onChange={onFiles}
          disabled={disabled || slotsLeft <= 0}
          className="peer sr-only"
        />
        <label
          htmlFor="listing-images"
          className={cn(
            buttonVariants({ variant: "secondary", size: "md" }),
            "cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-primary-600",
            (disabled || slotsLeft <= 0) && "pointer-events-none opacity-40",
          )}
        >
          Pilih foto
        </label>
        <p className="font-mono text-xs text-neutral-500">
          {value.length} / {IMAGE_RULES.maxCount} foto · JPG, PNG, WebP · maks.{" "}
          {MAX_RAW_IMAGE_BYTES / 1024 / 1024} MB, dikompres otomatis
        </p>
      </div>

      {problem && (
        <p role="alert" className="text-xs text-status-error">
          {problem}
        </p>
      )}

      {(value.length > 0 || uploads.length > 0) && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {value.map((image, index) => (
            <li key={image.url} className="space-y-1">
              <div className="relative aspect-square border border-neutral-300 bg-secondary-50">
                <Image
                  src={image.url}
                  alt={`Foto produk ${index + 1}`}
                  fill
                  sizes="160px"
                  unoptimized
                  className="object-cover"
                />
              </div>
              <p className="text-xs text-neutral-600">
                {index === 0 ? "Foto utama" : `Foto ${index + 1}`}
              </p>
              <div className="flex gap-3">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => makeCover(index)}
                    className={linkButton}
                  >
                    Jadikan utama
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className={cn(linkButton, "text-status-error")}
                >
                  Hapus
                </button>
              </div>
            </li>
          ))}
          {uploads.map((upload) => (
            <li key={upload.key} className="space-y-1">
              <div className="relative aspect-square border border-neutral-300 bg-secondary-50">
                <Image
                  src={upload.preview}
                  alt=""
                  fill
                  sizes="160px"
                  unoptimized
                  className={cn(
                    "object-cover",
                    upload.error === null && "opacity-50",
                  )}
                />
              </div>
              {upload.error === null ? (
                <p role="status" className="text-xs text-neutral-600">
                  Mengunggah…
                </p>
              ) : (
                <>
                  <p role="alert" className="text-xs text-status-error">
                    {upload.error}
                  </p>
                  <button
                    type="button"
                    onClick={() => dismiss(upload.key)}
                    className={linkButton}
                  >
                    Tutup
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
