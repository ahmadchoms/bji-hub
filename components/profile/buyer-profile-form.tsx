"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, Loader2, Save } from "lucide-react";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateBuyerProfileAction } from "@/actions/auth.actions";

export interface BuyerProfileValues {
  name: string;
  avatarUrl: string;
  phone: string;
  city: string;
  address: string;
}

interface BuyerProfileFormProps {
  initialData: {
    email: string;
    name: string;
    avatarUrl?: string;
    phone?: string;
    city?: string;
    address?: string;
  };
}

export function BuyerProfileForm({ initialData }: BuyerProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BuyerProfileValues>({
    defaultValues: {
      name: initialData.name || "",
      avatarUrl: initialData.avatarUrl || "",
      phone: initialData.phone || "",
      city: initialData.city || "",
      address: initialData.address || "",
    },
  });

  const avatarUrl = watch("avatarUrl");

  const onSubmit = async (values: BuyerProfileValues) => {
    setIsSubmitting(true);
    try {
      const res = await updateBuyerProfileAction({
        name: values.name,
        avatarUrl: values.avatarUrl,
        phone: values.phone,
        city: values.city,
        address: values.address,
      });

      if (!res.success) {
        toast.error("Gagal memperbarui profil", { description: res.error });
        return;
      }

      toast.success("Profil berhasil diperbarui!");
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan profil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="border border-neutral-300 bg-surface-base rounded-sm p-6 space-y-6">
        <div>
          <h3 className="font-display text-lg text-neutral-900 font-semibold">
            Informasi Profil Pembeli
          </h3>
          <p className="text-xs text-neutral-600 mt-0.5">
            Perbarui data diri, kontak, dan alamat pengiriman pesanan kopi Anda.
          </p>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4 border-b border-neutral-200">
          <div className="w-16 h-16 rounded-full border border-neutral-300 bg-neutral-100 overflow-hidden flex items-center justify-center shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Foto Profil"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-7 h-7 text-neutral-400" />
            )}
          </div>
          <div className="flex-1 w-full space-y-1">
            <FormField
              label="URL Foto Profil / Avatar"
              helperText="Tautan langsung ke foto profil Anda (JPG/PNG/WebP)."
            >
              <Input
                {...register("avatarUrl")}
                placeholder="https://example.com/foto-anda.jpg"
              />
            </FormField>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Nama Lengkap"
            required
            error={errors.name?.message}
          >
            <Input
              {...register("name", { required: "Nama lengkap wajib diisi" })}
              placeholder="Contoh: Budi Pratama"
            />
          </FormField>

          <FormField
            label="Alamat Email"
            helperText="Email akun utama (tidak dapat diubah)."
          >
            <Input value={initialData.email} disabled className="bg-neutral-100 text-neutral-600 cursor-not-allowed" />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Nomor WhatsApp / HP"
            helperText="Nomor aktif untuk konfirmasi pengiriman."
          >
            <Input
              {...register("phone")}
              placeholder="08123456789"
            />
          </FormField>

          <FormField
            label="Kota / Domisili"
            helperText="Kota asal untuk estimasi ongkos kirim."
          >
            <Input
              {...register("city")}
              placeholder="Jakarta Selatan, Bandung, Surabaya..."
            />
          </FormField>
        </div>

        <FormField
          label="Alamat Lengkap Pengiriman"
          helperText="Alamat rumah, kantor, atau kedai kopi untuk pengiriman pesanan."
        >
          <Textarea
            {...register("address")}
            rows={3}
            placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kode pos..."
          />
        </FormField>
      </div>

      <div className="flex items-center justify-end">
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="min-w-[140px] justify-center gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Simpan Profil</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
