import * as React from "react";
import { cn } from "cn";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "font-sans flex field-sizing-content min-h-16 w-full rounded-sm border border-neutral-300 bg-surface-base px-3 py-2 text-sm text-neutral-900 transition-colors outline-none placeholder:text-neutral-400 focus-visible:border-primary-600 focus-visible:ring-1 focus-visible:ring-primary-600 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-50 aria-invalid:border-status-error aria-invalid:ring-1 aria-invalid:ring-status-error",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
