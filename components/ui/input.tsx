import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-sm border border-neutral-300 bg-surface-base px-3 py-2 text-sm text-neutral-900 transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-neutral-900 placeholder:text-neutral-500 focus-visible:border-primary-600 focus-visible:ring-1 focus-visible:ring-primary-600 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-50 aria-invalid:border-status-error aria-invalid:ring-status-error",
        className
      )}
      {...props}
    />
  )
}

export { Input }
