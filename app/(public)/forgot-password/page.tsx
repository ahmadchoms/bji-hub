"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { requestPasswordResetAction } from "@/actions/auth.actions";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Silakan masukkan alamat email yang valid");
      return;
    }

    setIsLoading(true);
    try {
      const res = await requestPasswordResetAction({ email });
      if (res.success) {
        setIsSubmitted(true);
        setMessage(res.data.message);
      } else {
        toast.error(res.error || "Gagal memproses permintaan reset kata sandi");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-neutral-200/80 bg-white p-8 shadow-sm">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-900">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-900">
            Lupa Kata Sandi
          </h1>
          <p className="text-xs text-neutral-600 max-w-sm mx-auto">
            Masukkan alamat email yang terdaftar pada akun Biji Hub Anda untuk menerima tautan pemulihan kata sandi.
          </p>
        </div>

        {isSubmitted ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 space-y-2 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-sm">Permintaan Terkirim</p>
                <p className="leading-relaxed">{message}</p>
                <p className="text-xs text-emerald-700">
                  Periksa juga folder Spam atau Promosi bila tidak kunjung masuk dalam beberapa menit.
                </p>
              </div>
            </div>

            <Link href="/login" className="block w-full">
              <Button type="button" variant="outline" className="w-full justify-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Kembali ke Halaman Masuk</span>
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Alamat Email" required>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@roastery.com"
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
                  <span>Mengirimkan Tautan...</span>
                </>
              ) : (
                "Kirim Tautan Pemulihan"
              )}
            </Button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Kembali ke Masuk</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
