"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, Loader2, Save, ArrowRight } from "lucide-react";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateBuyerProfileAction } from "@/actions/auth.actions";

export interface BuyerProfileValues {
  name: string;
  avatarUrl: string;
  phone: string;
  province: string;
  city: string;
  postalCode: string;
  address: string;
}

interface BuyerProfileFormProps {
  initialData: {
    email: string;
    name: string;
    avatarUrl?: string;
    phone?: string;
    province?: string;
    city?: string;
    postalCode?: string;
    address?: string;
  };
  nextUrl?: string | null;
}

export function BuyerProfileForm({ initialData, nextUrl }: BuyerProfileFormProps) {
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
      province: initialData.province || "",
      city: initialData.city || "",
      postalCode: initialData.postalCode || "",
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
        province: values.province,
        city: values.city,
        postalCode: values.postalCode,
        address: values.address,
      });

      if (!res.success) {
        toast.error("Gagal memperbarui profil", { description: res.error });
        return;
      }

      if (nextUrl) {
        toast.success("Alamat berhasil disimpan! Melanjutkan ke pesanan...");
        router.push(nextUrl);
      } else {
        toast.success("Profil dan alamat pengiriman berhasil disimpan!");
        router.refresh();
      }
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
            Informasi Profil & Alamat Pengiriman
          </h3>
          <p className="text-xs text-neutral-600 mt-0.5">
            Data ini akan otomatis digunakan saat memesan biji kopi tanpa perlu mengisi ulang.
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
              helperText="Tautan langsung ke foto profil Anda (opsional)."
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
            label="Nama Penerima Pesanan"
            required
            error={errors.name?.message}
            helperText="Nama yang tertera pada paket kiriman."
          >
            <Input
              {...register("name", { required: "Nama penerima wajib diisi" })}
              placeholder="Contoh: Budi Pratama"
            />
          </FormField>

          <FormField
            label="Alamat Email Akun"
            helperText="Email akun utama (tidak dapat diubah)."
          >
            <Input
              value={initialData.email}
              disabled
              className="bg-neutral-100 text-neutral-600 cursor-not-allowed"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Nomor WhatsApp / HP Aktif"
            required
            error={errors.phone?.message}
            helperText="Kurir akan menghubungi nomor ini saat pengantaran."
          >
            <Input
              {...register("phone", {
                required: "Nomor WhatsApp/HP wajib diisi untuk kurir",
                minLength: { value: 9, message: "Nomor telepon minimal 9 digit" },
              })}
              placeholder="08123456789"
            />
          </FormField>

          <FormField
            label="Provinsi"
            required
            error={errors.province?.message}
            helperText="Provinsi domisili / pengiriman."
          >
            <Input
              {...register("province", { required: "Provinsi wajib diisi" })}
              placeholder="Contoh: Jawa Barat, DKI Jakarta, Bali"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Kota / Kabupaten"
            required
            error={errors.city?.message}
            helperText="Dasar perhitungan tarif ongkir kurir."
          >
            <Input
              {...register("city", { required: "Kota/Kabupaten wajib diisi" })}
              placeholder="Contoh: Kota Bandung, Jakarta Selatan, Surabaya"
            />
          </FormField>

          <FormField
            label="Kode Pos"
            helperText="5 digit kode pos (opsional tapi disarankan)."
          >
            <Input
              {...register("postalCode")}
              maxLength={5}
              placeholder="Contoh: 40162"
            />
          </FormField>
        </div>

        <FormField
          label="Alamat Lengkap Pengiriman"
          required
          error={errors.address?.message}
          helperText="Nama jalan, nomor rumah/toko, RT/RW, kelurahan, kecamatan, atau patokan lokasi."
        >
          <Textarea
            {...register("address", {
              required: "Alamat lengkap pengiriman wajib diisi",
              minLength: { value: 8, message: "Alamat minimal 8 karakter" },
            })}
            rows={3}
            placeholder="Contoh: Jl. Anggrek No. 12, RT 02/RW 05, Kel. Sukajadi, Kec. Sukajadi (Depan Kedai Kopi Sukses)"
          />
        </FormField>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="min-w-[160px] justify-center gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : nextUrl ? (
            <>
              <span>Simpan & Lanjut ke Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Simpan Profil & Alamat</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
