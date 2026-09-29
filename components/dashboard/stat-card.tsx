import { cn } from "@/lib/utils";

interface StatSummaryProps {
  text: string;
  className?: string;
}

export function StatSummary({ text, className }: StatSummaryProps) {
  return (
    <p className={cn("text-sm text-neutral-600 leading-relaxed", className)}>
      {text}
    </p>
  );
}
