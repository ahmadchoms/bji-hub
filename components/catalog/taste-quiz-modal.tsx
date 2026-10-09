"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, RotateCcw, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TasteQuizModalProps {
  className?: string;
  triggerVariant?: "default" | "outline" | "banner";
}

type QuizKey = "roast" | "process" | "acidity";

interface QuizOption {
  id: string;
  icon: string;
  title: string;
  desc: string;
  value: string;
}

interface QuizStep {
  step: number;
  key: QuizKey;
  question: string;
  subtitle: string;
  options: QuizOption[];
}

const STEPS: QuizStep[] = [
  {
    step: 1,
    key: "roast",
    question: "Alat seduh apa yang paling sering kamu pakai?",
    subtitle: "Tiap metode butuh tingkat sangrai (roast profile) yang berbeda.",
    options: [
      {
        id: "manual",
        icon: "☕",
        title: "Filter / Manual Brew",
        desc: "V60, Kalita Wave, Aeropress, Origami",
        value: "Light",
      },
      {
        id: "espresso",
        icon: "⚡",
        title: "Espresso / Kopi Susu",
        desc: "Mesin espresso, Rok Presso, Moka Pot",
        value: "Medium-Dark",
      },
      {
        id: "tubruk",
        icon: "🫖",
        title: "Tubruk / French Press",
        desc: "Seduh tubruk tradisional, French Press harian",
        value: "Medium",
      },
    ],
  },
  {
    step: 2,
    key: "process",
    question: "Notes rasa seperti apa yang memanjakan lidahmu?",
    subtitle: "Proses pascapanen menentukan dominasi rasa dalam cangkir.",
    options: [
      {
        id: "fruity",
        icon: "🍓",
        title: "Fruity & Floral",
        desc: "Asam buah berry, peach, mangga, wangi melati",
        value: "Natural",
      },
      {
        id: "chocolate",
        icon: "🍫",
        title: "Cokelat & Karamel",
        desc: "Kacang panggang, gula aren, dark chocolate gurih",
        value: "Wash",
      },
      {
        id: "spicy",
        icon: "🌿",
        title: "Earthy & Rempah",
        desc: "Kayu manis, cengkeh, herbal khas Sumatera",
        value: "Wet Hulled",
      },
    ],
  },
  {
    step: 3,
    key: "acidity",
    question: "Bagaimana preferensi keasaman (acidity) kamu?",
    subtitle: "Tingkat sensasi asam segar buah saat diseruput.",
    options: [
      {
        id: "high",
        icon: "🍋",
        title: "Suka Asam Segar",
        desc: "Sensasi juicy seperti buah tropis menyegarkan",
        value: "Tinggi",
      },
      {
        id: "balanced",
        icon: "⚖️",
        title: "Seimbang (Medium)",
        desc: "Harmonis antara manis, sedikit asam, dan pahit lembut",
        value: "Sedang",
      },
      {
        id: "low",
        icon: "🛡️",
        title: "Rendah Asam / Aman Perut",
        desc: "Bold, tebal, rasa pekat tanpa rasa asam mencolok",
        value: "Rendah",
      },
    ],
  },
];

export function TasteQuizModal({
  className,
  triggerVariant = "outline",
}: TasteQuizModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<{
    roast?: string;
    process?: string;
    acidity?: string;
  }>({});

  const isCompleted = currentStep >= STEPS.length;

  const handleSelect = (key: QuizKey, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setCurrentStep((prev) => prev + 1);
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentStep(0);
  };

  const handleApplyFilter = () => {
    const params = new URLSearchParams();
    if (answers.process) params.set("proses", answers.process);
    if (answers.roast) params.set("sangrai", answers.roast);

    setOpen(false);
    router.push(`/?${params.toString()}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          triggerVariant === "banner" ? (
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary-900 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-sm transition-colors"
            />
          ) : (
            <Button
              type="button"
              variant={triggerVariant === "default" ? "primary" : "outline"}
              size="md"
              className={className}
            />
          )
        }
      >
        <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mr-1.5" />
        <span>Kuis Rasa: Cari Kopi Pas</span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between pb-1 border-b border-neutral-200">
            <div className="flex items-center gap-2 text-primary-700">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
                Taste Matchmaker
              </span>
            </div>
            {!isCompleted && (
              <span className="text-xs font-mono text-neutral-500">
                Langkah {currentStep + 1} dari {STEPS.length}
              </span>
            )}
          </div>

          {!isCompleted ? (
            <>
              <DialogTitle className="font-display text-lg text-primary-900 font-semibold pt-2">
                {STEPS[currentStep].question}
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-600">
                {STEPS[currentStep].subtitle}
              </DialogDescription>
            </>
          ) : (
            <>
              <DialogTitle className="font-display text-xl text-primary-900 font-semibold pt-2">
                🎉 Profil Selera Kopimu Ditemukan!
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-600">
                Berdasarkan pilihanmu, berikut karakter biji kopi yang paling cocok untuk seduhanmu:
              </DialogDescription>
            </>
          )}
        </DialogHeader>

        {/* Question Options */}
        {!isCompleted ? (
          <div className="grid grid-cols-1 gap-2.5 pt-2">
            {STEPS[currentStep].options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(STEPS[currentStep].key, opt.value)}
                className="flex items-start gap-3.5 p-3.5 text-left rounded-sm border border-neutral-300 bg-surface-base hover:border-primary-600 hover:bg-primary-50/50 transition-all group"
              >
                <span className="text-2xl shrink-0 p-1 bg-neutral-100 rounded-xs group-hover:scale-110 transition-transform">
                  {opt.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 group-hover:text-primary-900">
                    {opt.title}
                  </p>
                  <p className="text-xs text-neutral-600 leading-snug mt-0.5">
                    {opt.desc}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-primary-700 shrink-0 self-center group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
          </div>
        ) : (
          /* Result Summary Card */
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-sm bg-neutral-50 border border-neutral-300 space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center size-6 rounded-full bg-accent-100 text-accent-700 text-xs font-bold">
                  ✓
                </span>
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-600 font-semibold">
                  Rekomendasi Spesifikasi Kopi
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-neutral-200">
                <div className="p-2 bg-surface-base rounded-xs border border-neutral-200">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">
                    Sangrai
                  </span>
                  <span className="text-xs font-bold text-primary-900">
                    {answers.roast || "Semua"}
                  </span>
                </div>
                <div className="p-2 bg-surface-base rounded-xs border border-neutral-200">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">
                    Proses
                  </span>
                  <span className="text-xs font-bold text-primary-900">
                    {answers.process || "Semua"}
                  </span>
                </div>
                <div className="p-2 bg-surface-base rounded-xs border border-neutral-200">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">
                    Keasaman
                  </span>
                  <span className="text-xs font-bold text-primary-900">
                    {answers.acidity || "Seimbang"}
                  </span>
                </div>
              </div>

              <p className="text-xs text-neutral-600 leading-relaxed">
                Kami telah menyaring katalog untuk menampilkan biji kopi yang selaras dengan metode seduh dan preferensi rasamu.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleReset}
                className="gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ulangi</span>
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleApplyFilter}
                className="flex-1 gap-2"
              >
                <Coffee className="w-4 h-4" />
                <span>Terapkan Filter & Lihat Kopi Cocok</span>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
