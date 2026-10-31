"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { verifyMfaAction } from "@/actions/mfa.actions";

interface Props {
  factorId: string;
  qrCode: string;
  secret: string;
}

export function AdminMfaEnrollClient({ factorId, qrCode, secret }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await verifyMfaAction(code, factorId);
      if (!res.success) {
        setError(res.error);
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan saat memverifikasi kode");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="border border-border/80 rounded-lg p-4 bg-surface-alt/50">
        <p className="text-sm font-medium text-foreground mb-3">
          1. Pindai kode QR ini dengan aplikasi authenticator (Google Authenticator, 1Password, Authy):
        </p>
        <div className="flex justify-center p-4 bg-white rounded-lg border border-border inline-block mx-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCode} alt="Kode QR 2FA Admin" className="w-48 h-48" />
        </div>
        <p className="text-xs text-neutral-600 mt-3 text-center">
          Atau masukkan kunci rahasia manual: <code className="font-mono bg-neutral-100 px-2 py-0.5 rounded text-neutral-800">{secret}</code>
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label htmlFor="totp-code" className="block text-sm font-medium text-foreground mb-1">
            2. Masukkan 6 digit kode dari aplikasi:
          </label>
          <input
            id="totp-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="Contoh: 123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
            className="w-full px-4 py-2 border border-border rounded-lg text-lg tracking-widest text-center font-mono focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Memverifikasi..." : "Aktivasi & Masuk ke Dashboard Admin"}
        </button>
      </form>
    </div>
  );
}
