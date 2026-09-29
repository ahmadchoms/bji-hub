import React from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  name?: string;
  htmlFor?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  name,
  htmlFor,
  required = false,
  helperText,
  error,
  className,
  children,
}: FormFieldProps) {
  const id = htmlFor || name;

  return (
    <div className={cn("flex flex-col gap-1.5 w-full", className)}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-xs font-medium text-neutral-700 select-none"
        >
          <span>{label}</span>
          {required && (
            <span className="text-status-error ml-0.5" aria-hidden="true">*</span>
          )}
        </label>
      </div>

      <div className="relative w-full">{children}</div>

      {error ? (
        <p role="alert" className="text-xs text-status-error mt-0.5">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-neutral-500 mt-0.5 leading-normal">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}