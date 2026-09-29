import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "default" | "light" | "monochrome";
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  iconOnly?: boolean;
  className?: string;
}

export function Logo({
  variant = "default",
  size = "md",
  showTagline = false,
  iconOnly = false,
  className,
}: LogoProps) {
  const isLight = variant === "light" || variant === "monochrome";

  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-7 h-7",
    lg: "w-9 h-9",
  };

  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 group transition-opacity hover:opacity-90 outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-md",
        className
      )}
      aria-label="Biji - Halaman Utama Direktori Kopi Indonesia"
    >
      {/* Artisanal Coffee Bean Mark */}
      <div
        className={cn(
          "rounded-sm flex items-center justify-center p-1.5",
          isLight
            ? "bg-white text-primary-900"
            : "bg-primary-600 text-white"
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={iconSizes[size]}
        >
          {/* Stylized coffee bean with roasted crack curve */}
          <ellipse cx="12" cy="12" rx="8" ry="10" />
          <path d="M12 2c-2 4-2 8 0 10s2 6 0 10" />
        </svg>
      </div>

      {!iconOnly && (
        <div className="flex flex-col">
          <span
            className={cn(
              "font-serif font-bold tracking-tight leading-none",
              sizeClasses[size],
              isLight ? "text-white" : "text-primary-900"
            )}
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            Biji
          </span>
          {showTagline && (
            <span
              className={cn(
                "text-[10px] tracking-wide uppercase font-medium mt-0.5",
                isLight ? "text-primary-100" : "text-neutral-500"
              )}
            >
              Direktori Kopi Indonesia
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
