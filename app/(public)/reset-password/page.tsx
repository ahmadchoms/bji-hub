"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { updatePasswordAction } from "@/actions/auth.actions";
import { validatePasswordStrength } from "@/lib/auth/password-rules";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      toast.error(strength.error || "Kata sandi tidak memenuhi kriteria keamanan");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Konfirmasi kata sandi tidak cocok");
      return;
    }

    setIsLoading(true);
    try {
      const res = await updatePasswordAction({ password });
      if (res.success) {
        toast.success("Kata sandi berhasil diperbarui! Silakan masuk kembali.");
        router.push(res.data.redirectTo || "/login?reset=success");
      } else {
        toast.error(res.error || "Gagal memperbarui kata sandi. Tautan mungkin telah kedaluwarsa.");
      }
    } catch {
      toast.error("Terjadi gangguan koneksi. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-neutral-200/80 bg-white p-8 shadow-sm">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-900">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-900">
            Atur Ulang Kata Sandi
          </h1>
          <p className="text-xs text-neutral-600 max-w-sm mx-auto">
            Masukkan kata sandi baru untuk akun Anda (minimal 8 karakter dengan kombinasi unik).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Kata Sandi Baru" required>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                required
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>

          <FormField label="Konfirmasi Kata Sandi Baru" required>
            <Input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi baru"
              required
              disabled={isLoading}
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isLoading}
            className="w-full justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Sandi Baru...</span>
              </>
            ) : (
              "Simpan Kata Sandi Baru"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
