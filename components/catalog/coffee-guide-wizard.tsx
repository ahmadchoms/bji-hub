"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Coffee, Sparkles, ArrowRight, ArrowLeft, RotateCcw, Check, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getGuideRecommendationsAction } from "@/actions/coffee-guide.actions";
import { saveTastePreferencesAction } from "@/actions/taste-preference.actions";
import type { CoffeeGuideCriteria, CoffeeGuideRecommendation } from "@/lib/coffee/guide";
import type { BrewMethodId } from "@/lib/coffee/brew-methods";

interface Props {
  className?: string;
  triggerVariant?: "default" | "outline" | "secondary";
}

const BREW_OPTIONS: Array<{ id: BrewMethodId; name: string; desc: string; icon: string }> = [
  { id: "v60", name: "V60 / Pour Over", desc: "Karakter bersih, notes buah & floral", icon: "☕" },
  { id: "espresso", name: "Espresso / Latte", desc: "Pekat, tebal, manis karamel", icon: "⚡" },
  { id: "aeropress", name: "AeroPress", desc: "Fleksibel, body seimbang", icon: "🎯" },
  { id: "french_press", name: "French Press", desc: "Full body, pekat alami", icon: "🫖" },
  { id: "tubruk", name: "Tubruk Tradisional", desc: "Aroma klasik dan mantap", icon: "🥄" },
  { id: "cold_brew", name: "Cold Brew", desc: "Rendah asam, manis segar", icon: "🧊" },
];

const BUDGET_OPTIONS = [
  { value: 100000, label: "< Rp 100.000", desc: "Pilihan hemat harian" },
  { value: 150000, label: "Rp 100.000 - 150.000", desc: "Kualitas specialty populer" },
  { value: 250000, label: "Rp 150.000 - 250.000", desc: "Lot mikro & proses eksperimental" },
  { value: 0, label: "Bebas Anggaran", desc: "Rekomendasi terbaik tanpa batas harga" },
];

export function CoffeeGuideWizard({ className, triggerVariant = "default" }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CoffeeGuideRecommendation[]>([]);

  // Wizard state
  const [brewMethod, setBrewMethod] = useState<BrewMethodId>("v60");
  const [acidity, setAcidity] = useState(4);
  const [sweetness, setSweetness] = useState(4);
  const [body, setBody] = useState(3);
  const [budget, setBudget] = useState(150000);
  const [freshness, setFreshness] = useState<"ultra_fresh" | "optimal" | "any">("optimal");

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("biji_coffee_guide_pref");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.brewMethod) setBrewMethod(parsed.brewMethod);
        if (parsed.acidity) setAcidity(parsed.acidity);
        if (parsed.sweetness) setSweetness(parsed.sweetness);
        if (parsed.body) setBody(parsed.body);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleCalculate = async () => {
    setLoading(true);
    setStep(5); // results page

    const criteria: CoffeeGuideCriteria = {
      brewMethod,
      acidity,
      sweetness,
      body,
      maxPrice: budget > 0 ? budget : undefined,
      freshnessPreference: freshness,
    };

    // Save locally
    try {
      localStorage.setItem("biji_coffee_guide_pref", JSON.stringify(criteria));
    } catch {
      // Ignore
    }

    // Save to user account in background if logged in
    void saveTastePreferencesAction({
      acidityPref: acidity,
      bodyPref: body,
      flavorTags: [brewMethod, freshness],
    });

    const res = await getGuideRecommendationsAction(criteria);
    if (res.success) {
      setResults(res.data.recommendations);
    }
    setLoading(false);
  };

  const resetQuiz = () => {
    setStep(1);
    setResults([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant={triggerVariant === "default" ? "primary" : "outline"}
            className={className}
            aria-label="Buka Pemandu Pilih Kopi"
          >
            <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
            <span>Pemandu Pilih Kopi</span>
          </Button>
        }
      />

      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        aria-describedby="guide-description"
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Coffee className="h-5 w-5" />
            </span>
            <DialogTitle className="text-xl font-bold">Pemandu Pilih Kopi</DialogTitle>
          </div>
          <DialogDescription id="guide-description" className="text-xs text-muted-foreground">
            Temukan 3 rekomendasi biji kopi yang paling cocok dengan selera seduh dan anggaranmu.
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 my-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                step >= s ? "bg-amber-600" : "bg-neutral-200 dark:bg-neutral-800"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Brew Method */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div>
              <h3 className="font-semibold text-base">Langkah 1: Alat seduh apa yang kamu pakai?</h3>
              <p className="text-xs text-muted-foreground">Profil sangrai disesuaikan dengan metode ekstraksi.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {BREW_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setBrewMethod(opt.id)}
                  className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    brewMethod === opt.id
                      ? "border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm"
                      : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300"
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm flex items-center justify-between">
                      {opt.name}
                      {brewMethod === opt.id && <Check className="h-4 w-4 text-amber-600" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setStep(2)} className="gap-2">
                Lanjut ke Rasa
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Taste Profile */}
        {step === 2 && (
          <div className="space-y-5 py-2">
            <div>
              <h3 className="font-semibold text-base">Langkah 2: Karakter rasa yang kamu sukai?</h3>
              <p className="text-xs text-muted-foreground">Tentukan intensitas keasaman, rasa manis, dan ketebalan body.</p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span>Tingkat Keasaman (Acidity)</span>
                  <span className="text-amber-600 font-bold">{acidity} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={acidity}
                  onChange={(e) => setAcidity(Number(e.target.value))}
                  className="w-full accent-amber-600"
                  aria-label="Tingkat Keasaman"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Rendah (Nyaman di lambung)</span>
                  <span>Tinggi (Buah segar / juicy)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span>Tingkat Manis (Sweetness)</span>
                  <span className="text-amber-600 font-bold">{sweetness} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={sweetness}
                  onChange={(e) => setSweetness(Number(e.target.value))}
                  className="w-full accent-amber-600"
                  aria-label="Tingkat Manis"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Ringan</span>
                  <span>Tinggi (Karamel / madu)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span>Ketebalan Rasa (Body)</span>
                  <span className="text-amber-600 font-bold">{body} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={body}
                  onChange={(e) => setBody(Number(e.target.value))}
                  className="w-full accent-amber-600"
                  aria-label="Ketebalan Rasa Body"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Ringan (Teh herbal)</span>
                  <span>Tebal (Sirup / cokelat pekat)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Kembali
              </Button>
              <Button onClick={() => setStep(3)} className="gap-2">
                Lanjut ke Anggaran <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Budget */}
        {step === 3 && (
          <div className="space-y-4 py-2">
            <div>
              <h3 className="font-semibold text-base">Langkah 3: Berapa batas anggaranmu?</h3>
              <p className="text-xs text-muted-foreground">Harga per kemasan kopi pilihan.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {BUDGET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBudget(opt.value)}
                  className={`p-3.5 rounded-xl border text-left transition focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    budget === opt.value
                      ? "border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm"
                      : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300"
                  }`}
                >
                  <div className="font-medium text-sm flex items-center justify-between">
                    {opt.label}
                    {budget === opt.value && <Check className="h-4 w-4 text-amber-600" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Kembali
              </Button>
              <Button onClick={() => setStep(4)} className="gap-2">
                Lanjut ke Kesegaran <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Freshness */}
        {step === 4 && (
          <div className="space-y-4 py-2">
            <div>
              <h3 className="font-semibold text-base">Langkah 4: Preferensi Kesegaran Sangrai</h3>
              <p className="text-xs text-muted-foreground">Pilih toleransi tanggal sangrai kopi yang dikirim.</p>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  id: "optimal",
                  title: "Siap Seduh (Rasa Puncak / Optimal)",
                  desc: "Disangrai 5-21 hari lalu, sudah melewati masa degassing dan rasa paling optimal.",
                },
                {
                  id: "ultra_fresh",
                  title: "Sangat Segar (< 7-14 hari)",
                  desc: "Baru keluar dari roaster, cocok untuk yang suka mendiamkan (rest) sendiri.",
                },
                {
                  id: "any",
                  title: "Bebas (Asalkan Segar)",
                  desc: "Kopi berkualitas prima yang masih dalam jendela rasa baik untuk diseduh.",
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFreshness(opt.id as "ultra_fresh" | "optimal" | "any")}
                  className={`w-full p-3.5 rounded-xl border text-left transition focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    freshness === opt.id
                      ? "border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm"
                      : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300"
                  }`}
                >
                  <div className="font-medium text-sm flex items-center justify-between">
                    {opt.title}
                    {freshness === opt.id && <Check className="h-4 w-4 text-amber-600" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(3)} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Kembali
              </Button>
              <Button onClick={handleCalculate} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                <Sparkles className="h-4 w-4" /> Lihat Rekomendasi
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Results */}
        {step === 5 && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base">Rekomendasi Biji Kopi Untukmu</h3>
                <p className="text-xs text-muted-foreground">3 pilihan teratas hasil personalisasi algoritma Biji.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={resetQuiz} className="text-xs gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Ulangi
              </Button>
            </div>

            {loading ? (
              <div className="py-12 text-center space-y-3">
                <Sparkles className="h-8 w-8 text-amber-500 animate-spin mx-auto" />
                <p className="text-sm font-medium">Menganalisis rasa dan profil sangrai...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground space-y-2">
                <p className="text-sm">Tidak ditemukan produk yang memenuhi kriteria saat ini.</p>
                <Button variant="outline" size="sm" onClick={resetQuiz}>
                  Coba kriteria lain
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((item, idx) => (
                  <div
                    key={item.listing.id}
                    className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-card hover:border-amber-500/50 transition space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-semibold text-amber-600">
                            #{idx + 1} Cocok {item.tasteMatchPct}%
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {item.listing.seller?.businessName || "Roastery Mitra"}
                          </span>
                        </div>
                        <h4 className="font-bold text-base mt-1 text-foreground">
                          {item.listing.title}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-sm text-foreground">
                          Rp {item.listing.price.toLocaleString("id-ID")}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          {item.listing.unit || "200g"}
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 font-medium">
                      💡 {item.reason}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex gap-1.5 text-xs text-muted-foreground">
                        <span>{item.listing.tasteProfile?.roastLevel || "Medium"}</span>
                        <span>•</span>
                        <span>{item.listing.tasteProfile?.processMethod || "Wash"}</span>
                      </div>
                      <Link
                        href={`/catalog/${item.listing.slug || item.listing.id}`}
                        onClick={() => setOpen(false)}
                      >
                        <Button size="sm" className="gap-1.5 text-xs">
                          <ShoppingBag className="h-3.5 w-3.5" /> Lihat Produk
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
