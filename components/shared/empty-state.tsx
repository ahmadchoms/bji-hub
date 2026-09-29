import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: "coffee" | "search" | React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = "Tidak ada hasil ditemukan",
  description = "Coba ubah kata kunci pencarian atau sesuaikan filter untuk menemukan lot kopi yang sesuai.",
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start justify-center p-8 md:p-12 text-left rounded-sm bg-surface-base border border-neutral-300 max-w-xl",
        className
      )}
    >
      <h3 className="font-display text-2xl text-neutral-900 mb-2 font-normal">
        {title}
      </h3>

      <p className="text-sm text-neutral-600 mb-6 leading-relaxed max-w-md">
        {description}
      </p>

      {action && <div>{action}</div>}
    </div>
  );
}
