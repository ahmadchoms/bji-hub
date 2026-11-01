"use client";

import { useState, useEffect } from "react";
import { Coffee, Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  lotCode: string;
  listingId: string;
  officialNotes?: string;
  officialScores: {
    acidity: number;
    body: number;
    sweetness: number;
    aroma: number;
    aftertaste: number;
  };
}

export function CuppingCardForm({
  lotCode,
  listingId,
  officialNotes,
  officialScores,
}: Props) {
  const [aroma, setAroma] = useState(officialScores.aroma || 4);
  const [acidity, setAcidity] = useState(officialScores.acidity || 4);
  const [sweetness, setSweetness] = useState(officialScores.sweetness || 4);
  const [body, setBody] = useState(officialScores.body || 3.5);
  const [aftertaste, setAftertaste] = useState(officialScores.aftertaste || 4);
  const [userNotes, setUserNotes] = useState("");
  const [savedMessage, setSavedMessage] = useState(false);

  const storageKey = `biji_cupping_notes_${lotCode}`;

  // Load saved notes on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.aroma) setAroma(parsed.aroma);
        if (parsed.acidity) setAcidity(parsed.acidity);
        if (parsed.sweetness) setSweetness(parsed.sweetness);
        if (parsed.body) setBody(parsed.body);
        if (parsed.aftertaste) setAftertaste(parsed.aftertaste);
        if (parsed.userNotes) setUserNotes(parsed.userNotes);
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  const handleSaveDraft = () => {
    const draft = {
      lotCode,
      listingId,
      aroma,
      acidity,
      sweetness,
      body,
      aftertaste,
      userNotes,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch {
      // ignore
    }
  };

  const calculateTotalScore = () => {
    // Standard baseline (10 points each scaled + 50 base points)
    const sum = (aroma + acidity + sweetness + body + aftertaste) * 2 + 50;
    return Math.min(100, Math.round(sum * 10) / 10);
  };

  return (
    <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-card shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Coffee className="h-5 w-5 text-amber-600" />
            Kartu Cicip Digital (Digital Cupping Card)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Catat hasil seduhanmu untuk lot ini. Nilai dapat disimpan sebagai draf ulasan.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground block">Estimasi Skor</span>
          <span className="font-bold text-lg text-amber-600">
            {calculateTotalScore()} / 100
          </span>
        </div>
      </div>

      {officialNotes && (
        <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 text-xs text-amber-900 dark:text-amber-200">
          <span className="font-semibold block mb-0.5">Official Cupping Notes:</span>
          {officialNotes}
        </div>
      )}

      {/* Sliders Grid */}
      <div className="space-y-4 pt-1">
        {[
          { label: "Aroma & Dry Fragrance", val: aroma, set: setAroma, desc: "Wangi kering bubuk dan uap basah saat diseduh" },
          { label: "Keasaman (Acidity)", val: acidity, set: setAcidity, desc: "Karakter asam buah segar yang bersih dan cerah" },
          { label: "Rasa Manis (Sweetness)", val: sweetness, set: setSweetness, desc: "Kemanisan alami gula buah, madu, atau karamel" },
          { label: "Ketebalan Rasa (Body)", val: body, set: setBody, desc: "Bobot dan sensasi tekstur di lidah saat diteguk" },
          { label: "Aftertaste (Panjang Rasa)", val: aftertaste, set: setAftertaste, desc: "Kesan rasa yang tertinggal setelah kopi ditelan" },
        ].map((item, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span>{item.label}</span>
              <span className="text-amber-600 font-bold">{item.val} / 5</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={item.val}
              onChange={(e) => item.set(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
              aria-label={item.label}
            />
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* User Notes */}
      <div className="space-y-1.5 pt-2">
        <label htmlFor="user-cupping-notes" className="text-xs font-semibold text-foreground">
          Catatan Rasa Pribadi (Tasting Notes)
        </label>
        <textarea
          id="user-cupping-notes"
          rows={3}
          value={userNotes}
          onChange={(e) => setUserNotes(e.target.value)}
          placeholder="Misal: Saat panas terasa aroma bunga melati, setelah agak dingin muncul rasa manis anggur hitam yang seimbang..."
          className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-background text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        {savedMessage ? (
          <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
            <Check className="h-4 w-4" /> Catatan cicip tersimpan di perangkat!
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            Draf tersimpan otomatis di browser.
          </span>
        )}

        <Button size="sm" onClick={handleSaveDraft} className="text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white">
          <Save className="h-3.5 w-3.5" /> Simpan Catatan Cicip
        </Button>
      </div>
    </div>
  );
}
