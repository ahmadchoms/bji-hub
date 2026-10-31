"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { verifyMfaAction } from "@/actions/mfa.actions";

export function AdminMfaVerifyClient() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await verifyMfaAction(code);
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
    <form onSubmit={handleVerify} className="space-y-4">
      <div>
        <label htmlFor="verify-code" className="block text-sm font-medium text-foreground mb-1 text-center">
          Kode Otentikasi (6 Digit)
        </label>
        <input
          id="verify-code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          required
          autoFocus
          className="w-full px-4 py-2 border border-border rounded-lg text-2xl tracking-widest text-center font-mono focus:ring-2 focus:ring-primary focus:outline-none"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {loading ? "Memverifikasi..." : "Verifikasi & Lanjutkan"}
      </button>

      <div className="pt-2 text-center">
        <a
          href="/admin/mfa/enroll"
          className="text-xs text-neutral-600 hover:text-foreground underline transition-colors"
        >
          Konfigurasi ulang faktor autentikasi
        </a>
      </div>
    </form>
  );
}
