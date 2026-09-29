"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { inquirySchema, InquiryFormValues } from "@/lib/validations/inquiry.schema";
import { submitInquiry } from "@/lib/mock/repository";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InquiryFormProps {
  listingId: string;
  listingTitle: string;
  sellerName: string;
  className?: string;
}

export function InquiryForm({
  listingId,
  listingTitle,
  sellerName,
  className,
}: InquiryFormProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      listingId,
      buyerName: "",
      buyerContact: "",
      quantity: "",
      message: "",
    },
  });

  const onSubmit = async (values: InquiryFormValues) => {
    try {
      setIsSubmitting(true);
      await submitInquiry(values);
      setIsSuccess(true);
      toast.success("Permintaan Penawaran Terkirim!", {
        description: `Pesan RFQ Anda telah diteruskan ke ${sellerName}. Penjual akan menghubungi Anda melalui kontak yang dicantumkan.`,
      });
      reset();
    } catch {
      toast.error("Gagal mengirim permintaan", {
        description: "Silakan periksa koneksi internet Anda dan coba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={cn("border border-accent-500/30 bg-accent-100/60 rounded-sm p-6 text-center space-y-3", className)}>
        <h4 className="font-display text-lg text-accent-700 font-semibold">
          Inquiry B2B Berhasil Terkirim!
        </h4>
        <p className="text-sm text-neutral-700 leading-relaxed max-w-sm mx-auto">
          Terima kasih. Permintaan harga grosir & spesifikasi untuk{" "}
          <strong>{listingTitle}</strong> telah diterima oleh {sellerName}.
        </p>
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSuccess(false)}
            className="text-xs border-accent-500/30 text-accent-700"
          >
            Kirim Permintaan Lain
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("border border-neutral-300 bg-surface-base rounded-sm p-5 space-y-4", className)}>
      <div className="pb-3 border-b border-neutral-200">
        <h4 className="font-display text-lg text-neutral-900 font-semibold">
          Formulir Inquiry Grosir / RFQ B2B
        </h4>
        <p className="text-xs text-neutral-600 leading-relaxed mt-1">
          Kirimkan penawaran harga khusus atau permintaan sampel langsung ke{" "}
          <span className="font-medium text-neutral-800">{sellerName}</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <input type="hidden" {...register("listingId")} value={listingId} />

        <FormField label="Nama Lengkap / Nama Bisnis Kafe" required error={errors.buyerName?.message}>
          <input
            type="text"
            {...register("buyerName")}
            placeholder="Contoh: Rian Pratama (Kafe Senja Kopi)"
            className="w-full h-10 px-3 text-sm bg-surface-base border border-neutral-300 rounded-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
          />
        </FormField>

        <FormField label="Nomor WhatsApp / Email Aktif" required helperText="Penjual akan merespons langsung ke kontak ini." error={errors.buyerContact?.message}>
          <input
            type="text"
            {...register("buyerContact")}
            placeholder="Contoh: 08123456789 atau rian@kafesenja.com"
            className="w-full h-10 px-3 text-sm bg-surface-base border border-neutral-300 rounded-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
          />
        </FormField>

        <FormField label="Perkiraan Jumlah Kebutuhan Pesanan" required error={errors.quantity?.message}>
          <input
            type="text"
            {...register("quantity")}
            placeholder="Contoh: 30 kg / bulan, atau 2 box sampel"
            className="w-full h-10 px-3 text-sm bg-surface-base border border-neutral-300 rounded-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
          />
        </FormField>

        <FormField label="Pesan & Spesifikasi yang Dibutuhkan" required helperText="Tuliskan spesifikasi roasting, profil rasa, atau permintaan penawaran harga kontrak." error={errors.message?.message}>
          <textarea
            rows={3}
            {...register("message")}
            placeholder="Halo, kami mencari pasokan biji kopi untuk menu espresso base. Apakah ada paket harga untuk kontrak suplai 6 bulan?"
            className="w-full p-3 text-sm bg-surface-base border border-neutral-300 rounded-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 resize-y min-h-[88px]"
          />
        </FormField>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting}
          className="w-full justify-center gap-2 font-medium"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Mengirim Permintaan...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Kirim Inquiry B2B Sekarang</span>
            </>
          )}
        </Button>
      </form>
    </div>
  );
}