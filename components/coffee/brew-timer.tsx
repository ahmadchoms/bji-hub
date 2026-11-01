"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, SkipForward, Coffee, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface WakeLockSentinelLike extends EventTarget {
  release(): Promise<void>;
}

export interface BrewStep {
  name: string;
  durationSeconds: number;
  waterTargetMl?: number;
  instruction: string;
}

interface BrewTimerProps {
  methodName: string;
  coffeeGrams?: number;
  totalWaterMl?: number;
  steps?: BrewStep[];
  className?: string;
}

const DEFAULT_V60_STEPS: BrewStep[] = [
  {
    name: "Blooming",
    durationSeconds: 45,
    waterTargetMl: 50,
    instruction: "Tuang air 50ml merata ke seluruh bubuk. Biarkan gas CO2 keluar.",
  },
  {
    name: "Tuangan Pertama",
    durationSeconds: 45,
    waterTargetMl: 150,
    instruction: "Tuang melingkar perlahan dari tengah ke luar hingga 150ml.",
  },
  {
    name: "Tuangan Kedua & Akhir",
    durationSeconds: 60,
    waterTargetMl: 250,
    instruction: "Lanjutkan tuangan hingga 250ml. Tunggu tetesan air turun sempurna.",
  },
];

export function BrewTimer({
  methodName,
  coffeeGrams = 15,
  totalWaterMl = 250,
  steps = DEFAULT_V60_STEPS,
  className,
}: BrewTimerProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(
    steps[0]?.durationSeconds || 45
  );
  const [isRunning, setIsRunning] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);

  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentStep = steps[currentStepIdx] || steps[0];

  // Request Wake Lock
  const requestWakeLock = async () => {
    if (typeof window !== "undefined" && "wakeLock" in navigator) {
      try {
        const nav = navigator as Navigator & {
          wakeLock?: { request(type: string): Promise<WakeLockSentinelLike> };
        };
        const sentinel = await nav.wakeLock?.request("screen");
        if (sentinel) {
          wakeLockRef.current = sentinel;
          setWakeLockActive(true);
          sentinel.addEventListener("release", () => {
            setWakeLockActive(false);
          });
        }
      } catch {
        // WakeLock request failed (e.g. low battery)
      }
    }
  };

  // Release Wake Lock
  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch {
        // ignore
      }
      setWakeLockActive(false);
    }
  };

  // Trigger vibration
  const triggerHaptic = () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {
        // ignore
      }
    }
  };

  // Timer loop
  useEffect(() => {
    if (isRunning) {
      void requestWakeLock();
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            triggerHaptic();
            // Advance to next step or stop
            if (currentStepIdx < steps.length - 1) {
              const nextIdx = currentStepIdx + 1;
              setCurrentStepIdx(nextIdx);
              return steps[nextIdx].durationSeconds;
            } else {
              setIsRunning(false);
              void releaseWakeLock();
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      void releaseWakeLock();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      void releaseWakeLock();
    };
  }, [isRunning, currentStepIdx, steps]);

  const toggleRun = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setCurrentStepIdx(0);
    setSecondsRemaining(steps[0]?.durationSeconds || 45);
  };

  const nextStep = () => {
    if (currentStepIdx < steps.length - 1) {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);
      setSecondsRemaining(steps[nextIdx].durationSeconds);
    } else {
      setIsRunning(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const isCompleted = currentStepIdx === steps.length - 1 && secondsRemaining === 0;

  return (
    <div
      className={`p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-card shadow-sm space-y-4 ${
        className || ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
            <Coffee className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-bold text-base text-foreground leading-none">
              Timer Seduh: {methodName}
            </h3>
            <span className="text-xs text-muted-foreground">
              Dosis: {coffeeGrams}g bubuk • Target: {totalWaterMl}ml air
            </span>
          </div>
        </div>

        {wakeLockActive && (
          <Badge variant="outline" className="text-xs text-emerald-600 gap-1">
            <Shield className="h-3 w-3" /> Layar Aktif
          </Badge>
        )}
      </div>

      {/* Step Progress Pills */}
      <div className="flex items-center gap-1.5">
        {steps.map((st, idx) => (
          <div
            key={idx}
            className={`h-2 flex-1 rounded-full transition-colors ${
              idx < currentStepIdx || isCompleted
                ? "bg-amber-600"
                : idx === currentStepIdx
                  ? "bg-amber-400 animate-pulse"
                  : "bg-neutral-200 dark:bg-neutral-800"
            }`}
          />
        ))}
      </div>

      {/* Big Countdown Display */}
      <div className="py-6 text-center space-y-2 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-800">
        <div className="text-xs font-semibold uppercase tracking-wider text-amber-600">
          Langkah {currentStepIdx + 1} dari {steps.length}: {currentStep.name}
        </div>
        <div className="font-mono font-bold text-5xl sm:text-6xl text-foreground">
          {formatTime(secondsRemaining)}
        </div>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto px-4">
          {isCompleted ? "🎉 Seduhan selesai! Selamat menikmati kopi." : currentStep.instruction}
        </p>
        {currentStep.waterTargetMl && !isCompleted && (
          <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Target Timbangan: {currentStep.waterTargetMl} ml
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <Button variant="outline" size="sm" onClick={resetTimer} className="text-xs gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </Button>

        <div className="flex items-center gap-2">
          {currentStepIdx < steps.length - 1 && (
            <Button variant="ghost" size="sm" onClick={nextStep} className="text-xs gap-1">
              Lewati <SkipForward className="h-3.5 w-3.5" />
            </Button>
          )}

          <Button
            size="sm"
            onClick={toggleRun}
            className={`gap-1.5 text-xs font-semibold ${
              isRunning
                ? "bg-neutral-800 text-white hover:bg-neutral-900"
                : "bg-amber-600 text-white hover:bg-amber-700"
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4" /> Jeda
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Mulai Seduh
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
