"use client";

import { useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { TasteProfile } from "@/types";
import { cn } from "@/lib/utils";

interface FlavorProfileProps {
  tasteProfile?: TasteProfile | null;
  className?: string;
}

const AXIS_CONFIGS: {
  key: keyof TasteProfile;
  label: string;
  maxScore: number;
}[] = [
  { key: "acidityScore", label: "Acidity", maxScore: 5 },
  { key: "bodyScore", label: "Body", maxScore: 5 },
  { key: "sweetnessScore", label: "Sweetness", maxScore: 5 },
  { key: "aromaScore", label: "Aroma", maxScore: 5 },
  { key: "aftertasteScore", label: "Aftertaste", maxScore: 5 },
];

function ScoreGauge({ label, score, max }: { label: string; score: number; max: number }) {
  const pct = (score / max) * 100;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-sans text-neutral-600">{label}</span>
        <span className="font-mono tabular-nums text-neutral-900 text-[11px]">
          {score.toFixed(1)}
        </span>
      </div>
      <div className="w-full h-1.5 bg-neutral-100 border border-neutral-300 rounded-xs overflow-hidden">
        <div
          className="h-full bg-primary-600 rounded-xs transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function FlavorProfile({ tasteProfile, className }: FlavorProfileProps) {
  const activeAxes = useMemo(() => {
    if (!tasteProfile) return [];
    return AXIS_CONFIGS.filter((axis) => {
      const val = tasteProfile[axis.key];
      return typeof val === "number" && !isNaN(val) && val > 0;
    }).map((axis) => ({
      subject: axis.label,
      score: Number(tasteProfile[axis.key]),
      fullMark: axis.maxScore,
    }));
  }, [tasteProfile]);

  const flavorText = useMemo(() => {
    if (!tasteProfile?.flavorNotes) return "";
    return tasteProfile.flavorNotes
      .split(/[,•|]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .join(", ");
  }, [tasteProfile?.flavorNotes]);

  if (!tasteProfile) {
    return (
      <div className={cn("p-6 bg-surface-base rounded-sm border border-neutral-300", className)}>
        <p className="font-display text-sm text-neutral-500 italic">
          Profil sensori belum tersedia untuk lot ini.
        </p>
      </div>
    );
  }

  const renderRadar = activeAxes.length >= 3;

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex items-baseline justify-between pb-2 border-b border-neutral-300">
        <h4 className="font-display text-lg text-neutral-900 font-semibold">
          Lembar Cupping
        </h4>
        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
          Skor 1–5
        </span>
      </div>

      {renderRadar ? (
        <div className="w-full h-56">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={activeAxes}>
              <PolarGrid stroke="#D8CFC5" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "#4A403A", fontSize: 11, fontFamily: "var(--font-sans)" }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 5]}
                stroke="#D8CFC5"
                tick={{ fill: "#8C8078", fontSize: 10 }}
              />
              <Radar
                name="Skor"
                dataKey="score"
                stroke="#512615"
                fill="#512615"
                fillOpacity={0.1}
                strokeWidth={1.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="space-y-3">
          {activeAxes.map((axis, i) => (
            <ScoreGauge
              key={i}
              label={axis.subject}
              score={axis.score}
              max={axis.fullMark}
            />
          ))}
        </div>
      )}

      {flavorText && (
        <div className="pt-3 border-t border-neutral-300">
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block mb-1">
            Catatan Rasa
          </span>
          <p className="font-display text-sm italic text-neutral-700 leading-relaxed">
            {flavorText}
          </p>
        </div>
      )}
    </div>
  );
}
