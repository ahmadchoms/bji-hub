import Image from "next/image";
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

  const imageSizes = {
    sm: { width: 28, height: 34, className: "h-7 w-auto" },
    md: { width: 36, height: 44, className: "h-9 w-auto" },
    lg: { width: 48, height: 58, className: "h-12 w-auto" },
  };

  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2.5 group transition-opacity hover:opacity-90 outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-md",
        className
      )}
      aria-label="Biji - Halaman Utama Direktori Kopi Indonesia"
    >
      {/* Official Biji Brand Mark */}
      <div
        className={cn(
          "relative flex items-center justify-center shrink-0",
          isLight && "brightness-0 invert"
        )}
      >
        <Image
          src="/assets/logo.png"
          alt="Biji Logo"
          width={imageSizes[size].width}
          height={imageSizes[size].height}
          priority
          className={cn(imageSizes[size].className, "object-contain shrink-0")}
        />
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
