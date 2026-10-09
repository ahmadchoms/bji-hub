"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  Coffee,
  Check,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    subtitle:
      "Tiap metode butuh profil sangrai yang tepat agar ekstraksi seimbang.",
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
    question: "Notes rasa seperti apa yang kamu sukai?",
    subtitle: "Proses pascapanen menentukan dominasi karakter aroma dan rasa.",
    options: [
      {
        id: "fruity",
        icon: "🍓",
        title: "Fruity & Floral",
        desc: "Asam buah berry, peach, mangga, aroma melati",
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
    question: "Bagaimana preferensi keasaman (acidity)?",
    subtitle: "Sensasi kesegaran fruity saat kopi pertama kali diseruput.",
    options: [
      {
        id: "high",
        icon: "🍋",
        title: "Suka Asam Segar",
        desc: "Sensasi juicy menyegarkan seperti buah tropis",
        value: "Tinggi",
      },
      {
        id: "balanced",
        icon: "⚖️",
        title: "Seimbang (Medium)",
        desc: "Harmonis antara manis, keasaman lembut, dan body",
        value: "Sedang",
      },
      {
        id: "low",
        icon: "🛡️",
        title: "Rendah Asam / Tebal",
        desc: "Body pekat dan bold tanpa keasaman yang dominan",
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

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
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
              className="group inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-neutral-800 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 rounded-md transition-all shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700 transition-transform group-hover:scale-110" />
              <span>Kuis Karakter Rasa</span>
            </button>
          ) : (
            <Button
              type="button"
              variant={triggerVariant === "default" ? "primary" : "outline"}
              className={cn("gap-2 shadow-2xs font-medium", className)}
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Cari Karakter Kopi</span>
            </Button>
          )
        }
      />

      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden border-neutral-200/80 bg-white shadow-xl rounded-xl">
        <div className="p-6 pb-4 border-b border-neutral-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentStep > 0 && !isCompleted ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 transition-colors pr-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Kembali</span>
                </button>
              ) : (
                <Badge
                  variant="outline"
                  className="gap-1.5 border-neutral-200 bg-neutral-50 text-neutral-700 text-[11px] font-mono tracking-wide"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  TASTE MATCH
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1.5 pr-8">
              {STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    isCompleted
                      ? "w-4 bg-emerald-500"
                      : idx === currentStep
                        ? "w-6 bg-neutral-900"
                        : idx < currentStep
                          ? "w-4 bg-neutral-300"
                          : "w-2 bg-neutral-100",
                  )}
                />
              ))}
            </div>
          </div>

          <DialogHeader className="text-left space-y-1">
            {!isCompleted ? (
              <>
                <DialogTitle className="text-xl font-bold tracking-tight text-neutral-900 leading-snug">
                  {STEPS[currentStep].question}
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-500 leading-relaxed">
                  {STEPS[currentStep].subtitle}
                </DialogDescription>
              </>
            ) : (
              <>
                <DialogTitle className="text-xl font-bold tracking-tight text-neutral-900 leading-snug">
                  Profil Seduhan Ditemukan
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-500 leading-relaxed">
                  Berdasarkan preferensimu, berikut acuan filter biji kopi yang
                  ideal untuk cangkir harianmu.
                </DialogDescription>
              </>
            )}
          </DialogHeader>
        </div>

        <div className="p-6">
          {!isCompleted ? (
            <div className="space-y-2.5">
              {STEPS[currentStep].options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    handleSelect(STEPS[currentStep].key, opt.value)
                  }
                  className="w-full flex items-center justify-between gap-4 p-3.5 text-left rounded-lg border border-neutral-200/90 bg-white hover:border-neutral-900 hover:bg-neutral-50/70 transition-all duration-150 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-neutral-100 text-lg shrink-0 border border-neutral-200/60 group-hover:bg-white transition-colors">
                      {opt.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 group-hover:text-neutral-950">
                        {opt.title}
                      </p>
                      <p className="text-xs text-neutral-500 truncate mt-0.5">
                        {opt.desc}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-lg border border-neutral-200/80 bg-neutral-50/50 p-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
                  <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-600 text-white">
                    <Check className="w-2.5 h-2.5 stroke-3" />
                  </div>
                  <span>Spesifikasi Rekomendasi</span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 bg-white rounded-md border border-neutral-200/70 shadow-2xs space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block font-medium">
                      Sangrai
                    </span>
                    <span className="text-xs font-bold text-neutral-900 block truncate">
                      {answers.roast || "Semua"}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-md border border-neutral-200/70 shadow-2xs space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block font-medium">
                      Proses
                    </span>
                    <span className="text-xs font-bold text-neutral-900 block truncate">
                      {answers.process || "Semua"}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-md border border-neutral-200/70 shadow-2xs space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block font-medium">
                      Acidity
                    </span>
                    <span className="text-xs font-bold text-neutral-900 block truncate">
                      {answers.acidity || "Seimbang"}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-neutral-500 leading-relaxed">
                  Filter katalog telah disesuaikan agar kamu langsung menemukan
                  biji kopi dengan variabel di atas.
                </p>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="h-10 px-3.5 text-xs text-neutral-600 hover:text-neutral-900 border-neutral-200"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Ulangi
                </Button>
                <Button
                  type="button"
                  onClick={handleApplyFilter}
                  className="h-10 flex-1 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs gap-2"
                >
                  <Coffee className="w-4 h-4" />
                  <span>Terapkan & Lihat Kopi Cocok</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
