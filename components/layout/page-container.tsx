import React from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  asGrid?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Standard page container adhering strictly to DESIGN.md §3.1:
 * - Mobile (< 640px): 16px padding, 4-col grid, 12px gap
 * - Tablet (640-1024px): 24px padding, 8-col grid, 16px gap
 * - Desktop (≥ 1024px): 32px padding, 12-col grid, 24px gap, max-width 1280px
 */
export function PageContainer({
  as: Component = "div",
  asGrid = false,
  children,
  className,
  ...props
}: PageContainerProps) {
  return (
    <Component
      className={cn(
        "w-full mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl",
        asGrid && "grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-6",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
