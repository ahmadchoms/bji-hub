"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ShieldCheck, FileText, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { recordConsentAction } from "@/actions/consent.actions";
import { type ConsentDocument, DOCUMENT_TITLES } from "@/lib/legal/versions";

interface ConsentGatewayProps {
  pendingDocuments: ConsentDocument[];
  returnTo?: string;
}

export function ConsentGateway({
  pendingDocuments: initialPending,
  returnTo = "/",
}: ConsentGatewayProps) {
  const router = useRouter();
  const safeReturnTo = !returnTo || returnTo === "/consent" ? "/" : returnTo;
  const [pending, setPending] = useState<ConsentDocument[]>(initialPending);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const docLinks: Record<ConsentDocument, string> = {
    terms: "/terms",
    privacy: "/privacy",
    seller_agreement: "/kebijakan-produk",
  };

  const handleConsent = (doc: ConsentDocument) => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await recordConsentAction(doc);
      if (res.success) {
        const nextPending = pending.filter((d) => d !== doc);
        setPending(nextPending);
        if (nextPending.length === 0) {
          router.push(safeReturnTo);
          router.refresh();
        }
      } else {
        setErrorMsg(res.error || "Gagal mencatat persetujuan");
      }
    });
  };

  const handleConsentAll = () => {
    setErrorMsg(null);
    startTransition(async () => {
      for (const doc of pending) {
        const res = await recordConsentAction(doc);
        if (!res.success) {
          setErrorMsg(res.error || "Gagal mencatat persetujuan");
          return;
        }
      }
      setPending([]);
      router.push(safeReturnTo);
      router.refresh();
    });
  };

  if (pending.length === 0) {
    return (
      <Card className="max-w-lg mx-auto border-emerald-200 bg-emerald-50/30">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-emerald-950 font-display">
            Persetujuan Selesai
          </h2>
          <p className="text-xs text-emerald-800">
            Seluruh kebijakan telah Anda setujui. Mengalihkan kembali...
          </p>
          <Link href={safeReturnTo}>
            <Button size="sm" className="mt-2 text-xs">
              Lanjut ke Halaman Utama <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-xl mx-auto border-neutral-300 shadow-sm">
      <CardHeader className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <CardTitle className="text-xl font-bold font-display text-neutral-900">
          Pembaruan Kebijakan & Persetujuan
        </CardTitle>
        <CardDescription className="text-xs text-neutral-600 leading-relaxed max-w-md mx-auto">
          Untuk terus menggunakan Biji Hub, silakan tinjau dan setujui versi terbaru dari dokumen kebijakan platform kami.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-3">
          {pending.map((doc) => (
            <div
              key={doc}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-neutral-200 bg-neutral-50/70"
            >
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-primary-700 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-neutral-900">
                    {DOCUMENT_TITLES[doc]}
                  </p>
                  <Link
                    href={docLinks[doc]}
                    target="_blank"
                    className="text-xs text-primary-700 underline hover:text-primary-900 inline-block mt-0.5"
                  >
                    Baca dokumen lengkap (buka tab baru) →
                  </Link>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleConsent(doc)}
                className="text-xs shrink-0 self-end sm:self-center"
              >
                Saya Setuju
              </Button>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-200">
        <p className="text-xs text-neutral-600 text-center sm:text-left">
          Dengan menyetujui, Anda menyetujui pemrosesan data sesuai ketentuan.
        </p>
        <Button
          onClick={handleConsentAll}
          disabled={isPending}
          className="text-xs w-full sm:w-auto"
        >
          Setujui Semua ({pending.length})
        </Button>
      </CardFooter>
    </Card>
  );
}
