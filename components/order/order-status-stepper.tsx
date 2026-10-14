import React from "react";
import { OrderStatus } from "@/types";
import { Check, Clock, CreditCard, Truck, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface OrderStatusStepperProps {
  status: OrderStatus;
  className?: string;
}

interface StepItem {
  key: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepItem[] = [
  { key: "created", label: "Dibuat", desc: "Pesanan masuk", icon: Clock },
  { key: "paid", label: "Dibayar", desc: "Escrow aman", icon: CreditCard },
  { key: "shipped", label: "Dikirim", desc: "Dalam kurir", icon: Truck },
  { key: "completed", label: "Selesai", desc: "Diterima pembeli", icon: CheckCircle2 },
];

export function OrderStatusStepper({ status, className = "" }: OrderStatusStepperProps) {
  // Determine current active step index (0-indexed: 0=created, 1=paid, 2=shipped, 3=completed)
  let activeIndex = 0;
  if (status === "paid") activeIndex = 1;
  else if (status === "shipped") activeIndex = 2;
  else if (status === "completed") activeIndex = 3;
  else if (status === "disputed") activeIndex = 2; // Shipped but disputed

  const isCanceled = status === "canceled";
  const isDisputed = status === "disputed";

  if (isCanceled) {
    return (
      <div className={`p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-center gap-2 text-rose-700 text-xs font-medium ${className}`}>
        <XCircle className="w-4 h-4 text-rose-600" />
        Pesanan ini telah dibatalkan
      </div>
    );
  }

  return (
    <div className={`w-full py-2 ${className}`}>
      <div className="relative flex items-center justify-between">
        {/* Background connector line */}
        <div className="absolute left-6 right-6 top-4 sm:top-5 -translate-y-1/2 h-0.5 bg-neutral-200 -z-0" />

        {/* Active progress connector line */}
        <div
          className="absolute left-6 top-4 sm:top-5 -translate-y-1/2 h-0.5 bg-emerald-600 transition-all duration-500 -z-0"
          style={{
            width: `${(activeIndex / (STEPS.length - 1)) * 100}%`,
            maxWidth: "calc(100% - 3rem)",
          }}
        />

        {STEPS.map((step, idx) => {
          const isCompleted = idx < activeIndex || (idx === activeIndex && status === "completed");
          const isCurrent = idx === activeIndex && status !== "completed";
          const Icon = step.icon;

          return (
            <div
              key={step.key}
              className="relative z-10 flex flex-col items-center text-center px-1 group"
            >
              {/* Step Circle Node */}
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? "bg-emerald-600 text-white shadow-xs"
                    : isCurrent
                      ? "bg-white text-emerald-700 border-2 border-emerald-600 ring-4 ring-emerald-100 font-bold"
                      : "bg-white text-neutral-400 border-2 border-neutral-300"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                ) : (
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </div>

              {/* Step Labels */}
              <div className="mt-2 space-y-0.5">
                <p
                  className={`text-xs font-semibold ${
                    isCurrent
                      ? "text-emerald-700"
                      : isCompleted
                        ? "text-neutral-900"
                        : "text-neutral-400"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[10px] text-neutral-500 hidden sm:block">
                  {step.desc}
                </p>
              </div>

              {/* Special Tag for Disputed or Active */}
              {isCurrent && isDisputed && (
                <span className="mt-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[9px] font-semibold">
                  <AlertTriangle className="w-2.5 h-2.5" /> Komplain
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
