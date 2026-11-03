import * as React from "react";
import { cn } from "@/lib/utils";

export interface DataTableContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
}

export function DataTableContainer({
  className,
  children,
  header,
  ...props
}: DataTableContainerProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-neutral-300 bg-surface-base shadow-2xs overflow-hidden",
        className,
      )}
      {...props}
    >
      {header && (
        <div className="border-b border-neutral-200 bg-white px-4 py-3">
          {header}
        </div>
      )}
      <div className="w-full overflow-x-auto">{children}</div>
    </div>
  );
}
