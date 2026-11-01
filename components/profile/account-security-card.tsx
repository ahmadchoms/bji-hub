"use client";

import { useState, useTransition } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { KeyRound, LogOut, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { changePasswordFromProfileAction, signOutAllDevicesAction } from "@/actions/account.actions";
import { toast } from "sonner";

export function AccountSecurityCard() {
  const [isPending, startTransition] = useTransition();

  // Change password form state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);

  // Sign out all devices state
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);

    if (!oldPassword) {
      setPwdError("Kata sandi saat ini wajib diisi");
      return;
    }

    if (newPassword.length < 8) {
      setPwdError("Kata sandi baru minimal 8 karakter");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError("Konfirmasi kata sandi baru tidak cocok");
      return;
    }

    startTransition(async () => {
      const res = await changePasswordFromProfileAction({
        oldPassword,
        newPassword,
      });

      if (res.success) {
        setPwdSuccess(res.data.message);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast.success("Kata sandi berhasil diperbarui");
      } else {
        setPwdError(res.error);
        toast.error("Gagal memperbarui kata sandi", { description: res.error });
      }
    });
  };

  const handleSignOutAll = () => {
    setSignOutError(null);
    startTransition(async () => {
      const res = await signOutAllDevicesAction();
      if (res.success) {
        toast.success("Berhasil keluar dari seluruh perangkat");
        window.location.href = res.data.redirectTo;
      } else {
        setSignOutError(res.error);
        toast.error("Gagal keluar dari semua perangkat", { description: res.error });
      }
    });
  };

  return (
    <Card className="border-neutral-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-neutral-100 text-neutral-800">
            <KeyRound className="h-5 w-5 text-neutral-700" />
          </div>
          <div>
            <CardTitle className="text-base text-neutral-900">
              Keamanan Akun & Kredensial
            </CardTitle>
            <CardDescription className="text-xs text-neutral-600">
              Perbarui kata sandi Anda dan kelola sesi aktif di perangkat lain.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-1">
        {/* Form Ganti Kata Sandi */}
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <p className="text-xs font-semibold text-neutral-900">Ganti Kata Sandi</p>

          {pwdError && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pwdError}</span>
            </div>
          )}

          {pwdSuccess && (
            <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{pwdSuccess}</span>
            </div>
          )}

          <FormField label="Kata Sandi Saat Ini" required>
            <Input
              type={showPassword ? "text" : "password"}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Masukkan kata sandi saat ini"
              autoComplete="current-password"
            />
          </FormField>

          <FormField label="Kata Sandi Baru" required>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-700"
                aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </FormField>

          <FormField label="Konfirmasi Kata Sandi Baru" required>
            <Input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi baru"
              autoComplete="new-password"
            />
          </FormField>

          <Button
            type="submit"
            size="sm"
            disabled={isPending}
            className="text-xs"
          >
            {isPending ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
          </Button>
        </form>

        <div className="border-t border-neutral-200 pt-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
            <div>
              <p className="text-xs font-semibold text-neutral-900">Keluar dari Seluruh Perangkat Lain</p>
              <p className="text-xs text-neutral-600 leading-relaxed mt-0.5">
                Cabut seluruh sesi aktif di browser dan ponsel lain untuk mengamankan akun Anda dari akses tidak dikenal.
              </p>
              {signOutError && (
                <p className="text-xs text-red-600 mt-1">{signOutError}</p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={handleSignOutAll}
              className="text-xs shrink-0 text-amber-800 border-amber-300 hover:bg-amber-50 gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar dari Semua Perangkat
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
