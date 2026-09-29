import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Gagal Memuat Data",
  message = "Terjadi kendala saat mengambil data. Silakan coba kembali.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start justify-center p-8 md:p-12 text-left rounded-sm bg-surface-base border border-neutral-300 max-w-xl",
        className
      )}
    >
      <h3 className="font-display text-2xl text-neutral-900 mb-2 font-normal">
        {title}
      </h3>

      <p className="text-sm text-neutral-600 mb-6 leading-relaxed max-w-md">
        {message}
      </p>

      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
        >
          Muat Ulang
        </Button>
      )}
    </div>
  );
}
