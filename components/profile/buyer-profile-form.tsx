"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  User,
  Loader2,
  Save,
  Plus,
  MapPin,
  Check,
  Trash2,
  Edit3,
  ArrowRight,
  Camera,
  Home,
} from "lucide-react";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  updateBuyerProfileAction,
  updateBuyerAddressesAction,
} from "@/actions/auth.actions";
import { uploadImage } from "@/lib/upload-client";
import type { BuyerAddress } from "@/types";

export interface BuyerBioValues {
  name: string;
  avatarUrl: string;
  phone: string;
}

interface AddressFormValues {
  label: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  postalCode: string;
  address: string;
  isPrimary: boolean;
}

interface BuyerProfileFormProps {
  initialData: {
    email: string;
    name: string;
    avatarUrl?: string;
    phone?: string;
    addresses?: BuyerAddress[];
  };
  nextUrl?: string | null;
}

export function BuyerProfileForm({
  initialData,
  nextUrl,
}: BuyerProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bio state
  const [isSubmittingBio, setIsSubmittingBio] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Address state
  const [addresses, setAddresses] = useState<BuyerAddress[]>(
    initialData.addresses || [],
  );
  const [isSavingAddresses, setIsSavingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // 1. Form Biodata Diri (Non-Address)
  const {
    register: registerBio,
    handleSubmit: handleSubmitBio,
    watch: watchBio,
    setValue: setValueBio,
    formState: { errors: errorsBio },
  } = useForm<BuyerBioValues>({
    defaultValues: {
      name: initialData.name || "",
      avatarUrl: initialData.avatarUrl || "",
      phone: initialData.phone || "",
    },
  });

  const avatarUrl = watchBio("avatarUrl");

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadImage(file);
      setValueBio("avatarUrl", res.url, {
        shouldValidate: true,
        shouldDirty: true,
      });
      toast.success("Foto profil berhasil diunggah!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal mengunggah foto profil",
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = () => {
    setValueBio("avatarUrl", "", { shouldValidate: true, shouldDirty: true });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmitBio = async (values: BuyerBioValues) => {
    setIsSubmittingBio(true);
    try {
      const res = await updateBuyerProfileAction({
        name: values.name,
        avatarUrl: values.avatarUrl,
        phone: values.phone,
        addresses,
      });

      if (!res.success) {
        toast.error("Gagal memperbarui biodata", { description: res.error });
        return;
      }

      toast.success("Biodata diri berhasil diperbarui!");
      router.refresh();
    } catch {
      // ignore: UI error toast already handled
      toast.error("Terjadi kesalahan saat menyimpan biodata.");
    } finally {
      setIsSubmittingBio(false);
    }
  };

  // 2. Form Tambah / Edit Alamat
  const {
    register: registerAddress,
    handleSubmit: handleSubmitAddress,
    reset: resetAddressForm,
    formState: { errors: errorsAddress },
  } = useForm<AddressFormValues>({
    defaultValues: {
      label: "Rumah",
      recipientName: initialData.name || "",
      phone: initialData.phone || "",
      province: "",
      city: "",
      postalCode: "",
      address: "",
      isPrimary: addresses.length === 0,
    },
  });

  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    resetAddressForm({
      label: "Rumah",
      recipientName: initialData.name || "",
      phone: initialData.phone || "",
      province: "",
      city: "",
      postalCode: "",
      address: "",
      isPrimary: addresses.length === 0,
    });
    setShowAddressForm(true);
  };

  const handleOpenEditAddress = (addr: BuyerAddress) => {
    setEditingAddressId(addr.id);
    resetAddressForm({
      label: addr.label,
      recipientName: addr.recipientName,
      phone: addr.phone,
      province: addr.province,
      city: addr.city,
      postalCode: addr.postalCode || "",
      address: addr.address,
      isPrimary: addr.isPrimary,
    });
    setShowAddressForm(true);
  };

  const persistAddresses = async (newAddresses: BuyerAddress[]) => {
    setIsSavingAddresses(true);
    try {
      const res = await updateBuyerAddressesAction(newAddresses);
      if (!res.success) {
        toast.error("Gagal menyimpan alamat", { description: res.error });
        return false;
      }
      setAddresses(newAddresses);
      toast.success("Daftar alamat berhasil diperbarui!");
      router.refresh();
      return true;
    } catch {
      // ignore: UI error toast already handled
      toast.error("Terjadi kesalahan saat memperbarui alamat.");
      return false;
    } finally {
      setIsSavingAddresses(false);
    }
  };

  const onSubmitAddress = async (values: AddressFormValues) => {
    let updated: BuyerAddress[] = [];

    if (editingAddressId) {
      updated = addresses.map((a) => {
        if (a.id === editingAddressId) {
          return {
            ...a,
            label: values.label.trim() || "Alamat",
            recipientName: values.recipientName.trim(),
            phone: values.phone.trim(),
            province: values.province.trim(),
            city: values.city.trim(),
            postalCode: values.postalCode.trim() || undefined,
            address: values.address.trim(),
            isPrimary: values.isPrimary,
          };
        }
        return values.isPrimary ? { ...a, isPrimary: false } : a;
      });
    } else {
      const newAddr: BuyerAddress = {
        id: `addr-${Date.now()}`,
        label: values.label.trim() || "Alamat",
        recipientName: values.recipientName.trim(),
        phone: values.phone.trim(),
        province: values.province.trim(),
        city: values.city.trim(),
        postalCode: values.postalCode.trim() || undefined,
        address: values.address.trim(),
        isPrimary: values.isPrimary || addresses.length === 0,
      };

      updated = values.isPrimary
        ? addresses.map((a) => ({ ...a, isPrimary: false })).concat(newAddr)
        : [...addresses, newAddr];
    }

    // Ensure at least one primary
    if (updated.length > 0 && !updated.some((a) => a.isPrimary)) {
      updated[0].isPrimary = true;
    }

    const ok = await persistAddresses(updated);
    if (ok) {
      setShowAddressForm(false);
      setEditingAddressId(null);
    }
  };

  const handleSetPrimary = async (id: string) => {
    const updated = addresses.map((a) => ({
      ...a,
      isPrimary: a.id === id,
    }));
    await persistAddresses(updated);
  };

  const handleDeleteAddress = async (id: string) => {
    if (
      !confirm(
        "Apakah Anda yakin ingin menghapus alamat pengiriman ini dari daftar?",
      )
    )
      return;
    const updated = addresses.filter((a) => a.id !== id);
    if (updated.length > 0 && !updated.some((a) => a.isPrimary)) {
      updated[0].isPrimary = true;
    }
    await persistAddresses(updated);
  };

  return (
    <div className="space-y-8">
      {/* 1. Form Biodata Diri (Tokopedia Style: Non-Address) */}
      <form
        onSubmit={handleSubmitBio(onSubmitBio)}
        className="border border-neutral-300 bg-surface-base rounded-sm p-6 space-y-6 shadow-2xs"
      >
        <div className="border-b border-neutral-200 pb-4">
          <h2 className="font-display text-lg text-neutral-900 font-bold">
            Biodata Diri
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            Informasi nama dan kontak akun pembeli Anda.
          </p>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4 border-b border-neutral-200">
          <div className="w-16 h-16 rounded-full border border-neutral-300 bg-neutral-100 overflow-hidden flex items-center justify-center shrink-0 relative group">
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
            {isUploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1 w-full space-y-1.5">
            <label className="text-xs font-semibold text-neutral-800 block">
              Foto Profil
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleAvatarFile}
              className="hidden"
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="text-xs h-8 border-neutral-300 hover:bg-neutral-50 text-neutral-800"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Mengunggah...
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5 text-neutral-600 mr-1.5" />
                    {avatarUrl ? "Ganti Foto" : "Unggah Foto"}
                  </>
                )}
              </Button>

              {avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isUploading}
                  onClick={handleRemoveAvatar}
                  className="text-xs h-8 text-neutral-600 hover:text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Hapus
                </Button>
              )}
            </div>
            <p className="text-xs text-neutral-600">
              Format JPG, PNG, atau WEBP. Maksimum 2 MB.
            </p>
          </div>
        </div>

        {/* Input Data Diri */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Nama Lengkap"
            required
            error={errorsBio.name?.message}
            helperText="Nama yang tampil pada profil akun Anda."
          >
            <Input
              {...registerBio("name", {
                required: "Nama lengkap wajib diisi",
                minLength: { value: 2, message: "Minimal 2 karakter" },
              })}
              placeholder="Contoh: Akbar Hakim"
            />
          </FormField>

          <FormField
            label="Alamat Email"
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
            label="Nomor Telepon / WhatsApp"
            required
            error={errorsBio.phone?.message}
            helperText="Nomor aktif untuk verifikasi dan konfirmasi akun."
          >
            <Input
              {...registerBio("phone", {
                required: "Nomor telepon wajib diisi",
                minLength: {
                  value: 9,
                  message: "Nomor telepon minimal 9 digit",
                },
              })}
              placeholder="08123456789"
            />
          </FormField>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmittingBio}
            className="text-xs h-9 px-5 gap-1.5 font-semibold"
          >
            {isSubmittingBio ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Simpan Biodata
              </>
            )}
          </Button>
        </div>
      </form>

      {/* 2. Form / Kelola Daftar Alamat (Tokopedia Style) */}
      <section className="border border-neutral-300 bg-surface-base rounded-sm p-6 space-y-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-4">
          <div>
            <h2 className="font-display text-lg text-neutral-900 font-bold">
              Daftar Alamat
            </h2>
            <p className="text-xs text-neutral-600 mt-0.5">
              Kelola alamat pengiriman untuk kemudahan checkout transaksi biji
              kopi Anda.
            </p>
          </div>
          {!showAddressForm && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenAddAddress}
              className="text-xs font-semibold gap-1.5 self-start sm:self-auto border-neutral-300 text-neutral-800 hover:bg-neutral-50"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Alamat Baru
            </Button>
          )}
        </div>

        {/* Modal / Form Tambah atau Edit Alamat */}
        {showAddressForm && (
          <form
            onSubmit={handleSubmitAddress(onSubmitAddress)}
            className="p-5 rounded-md border border-neutral-300 bg-neutral-50/70 space-y-4 animate-in fade-in-50"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-700" />
                {editingAddressId ? "Ubah Alamat Pengiriman" : "Tambah Alamat Pengiriman Baru"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddressForm(false);
                  setEditingAddressId(null);
                }}
                className="text-xs text-neutral-600 hover:text-neutral-800"
              >
                Batal
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField
                label="Label Alamat"
                required
                error={errorsAddress.label?.message}
                helperText="Contoh: Rumah, Kantor, Kedai"
              >
                <Input
                  {...registerAddress("label", {
                    required: "Label alamat wajib diisi",
                  })}
                  placeholder="Rumah"
                />
              </FormField>

              <FormField
                label="Nama Penerima"
                required
                error={errorsAddress.recipientName?.message}
              >
                <Input
                  {...registerAddress("recipientName", {
                    required: "Nama penerima wajib diisi",
                  })}
                  placeholder="Nama Lengkap Penerima"
                />
              </FormField>

              <FormField
                label="Nomor HP Penerima"
                required
                error={errorsAddress.phone?.message}
              >
                <Input
                  {...registerAddress("phone", {
                    required: "Nomor HP wajib diisi",
                    minLength: {
                      value: 9,
                      message: "Minimal 9 digit",
                    },
                  })}
                  placeholder="08123456789"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField
                label="Provinsi"
                required
                error={errorsAddress.province?.message}
              >
                <Input
                  {...registerAddress("province", {
                    required: "Provinsi wajib diisi",
                  })}
                  placeholder="Contoh: Jawa Barat"
                />
              </FormField>

              <FormField
                label="Kota / Kabupaten"
                required
                error={errorsAddress.city?.message}
              >
                <Input
                  {...registerAddress("city", {
                    required: "Kota/Kabupaten wajib diisi",
                  })}
                  placeholder="Contoh: Kota Bandung"
                />
              </FormField>

              <FormField label="Kode Pos">
                <Input
                  {...registerAddress("postalCode")}
                  maxLength={5}
                  placeholder="Contoh: 40162"
                />
              </FormField>
            </div>

            <FormField
              label="Alamat Lengkap"
              required
              error={errorsAddress.address?.message}
              helperText="Jalan, No. Rumah/Bangunan, RT/RW, Kelurahan, Kecamatan, Patokan"
            >
              <Textarea
                {...registerAddress("address", {
                  required: "Alamat lengkap wajib diisi",
                  minLength: {
                    value: 8,
                    message: "Alamat minimal 8 karakter",
                  },
                })}
                rows={3}
                placeholder="Jl. Anggrek No. 12, RT 02/RW 05, Kel. Sukajadi, Kec. Sukajadi"
              />
            </FormField>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isPrimaryCheckbox"
                {...registerAddress("isPrimary")}
                className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <label
                htmlFor="isPrimaryCheckbox"
                className="text-xs font-medium text-neutral-800 cursor-pointer"
              >
                Jadikan sebagai alamat utama
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddressForm(false);
                  setEditingAddressId(null);
                }}
                className="text-xs h-9 px-4"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSavingAddresses}
                className="text-xs h-9 px-5 font-semibold"
              >
                {isSavingAddresses ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Alamat"
                )}
              </Button>
            </div>
          </form>
        )}

        {/* List of Saved Addresses */}
        {addresses.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-neutral-200 rounded-md space-y-2">
            <Home className="w-8 h-8 text-neutral-400 mx-auto" />
            <p className="text-xs font-semibold text-neutral-700">
              Belum ada alamat pengiriman tersimpan
            </p>
            <p className="text-xs text-neutral-600 max-w-sm mx-auto">
              Tambahkan alamat untuk mempermudah perhitungan ongkir dan pengiriman otomatis saat checkout kopi.
            </p>
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenAddAddress}
                className="text-xs h-8 font-semibold"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Alamat Sekarang
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`p-4 rounded-md border transition-all ${
                  addr.isPrimary
                    ? "border-primary-500 bg-primary-50/20 ring-1 ring-primary-500/50"
                    : "border-neutral-200 bg-white hover:border-neutral-300"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-neutral-900 font-display">
                        {addr.label}
                      </span>
                      {addr.isPrimary && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold px-2 py-0.5 rounded"
                        >
                          Utama
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-neutral-900">
                      {addr.recipientName}{" "}
                      <span className="text-neutral-600 font-normal">
                        ({addr.phone})
                      </span>
                    </p>

                    <p className="text-xs text-neutral-700 leading-relaxed max-w-lg">
                      {addr.address}
                    </p>

                    <p className="text-xs text-neutral-600">
                      {addr.city}, {addr.province}
                      {addr.postalCode ? ` - ${addr.postalCode}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pt-2 sm:pt-0">
                    {!addr.isPrimary && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isSavingAddresses}
                        onClick={() => handleSetPrimary(addr.id)}
                        className="text-xs h-8 text-primary-700 hover:bg-primary-50 px-2.5 font-medium"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Jadikan Utama
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditAddress(addr)}
                      className="text-xs h-8 border-neutral-200 text-neutral-700 hover:bg-neutral-50 px-2.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1 text-neutral-600" />
                      Ubah
                    </Button>

                    {addresses.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isSavingAddresses}
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-xs h-8 text-neutral-400 hover:text-rose-600 px-2"
                        title="Hapus Alamat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action jika redirected dari checkout */}
        {nextUrl && addresses.length > 0 && (
          <div className="pt-4 border-t border-neutral-200 flex justify-end">
            <Button
              type="button"
              variant="primary"
              onClick={() => router.push(nextUrl)}
              className="text-xs font-semibold gap-1.5 h-9 px-5"
            >
              <span>Lanjut ke Pemesanan</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
