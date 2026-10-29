"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4.5 text-emerald-700 shrink-0" />,
        info: <InfoIcon className="size-4.5 text-primary-700 shrink-0" />,
        warning: <TriangleAlertIcon className="size-4.5 text-amber-700 shrink-0" />,
        error: <OctagonXIcon className="size-4.5 text-red-700 shrink-0" />,
        loading: <Loader2Icon className="size-4.5 animate-spin text-primary-700 shrink-0" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group font-sans text-xs sm:text-sm shadow-lg rounded-sm border border-neutral-300 bg-white text-neutral-900 p-4 gap-3",
          title: "!font-semibold !text-neutral-900 text-sm",
          description:
            "!text-neutral-700 !opacity-100 !block text-xs mt-1 leading-normal font-normal",
          actionButton:
            "!bg-primary-700 !text-white hover:!bg-primary-800 text-xs px-3 py-1.5 rounded-sm font-medium transition-colors",
          cancelButton:
            "!bg-neutral-100 !text-neutral-700 hover:!bg-neutral-200 text-xs px-3 py-1.5 rounded-sm transition-colors",
          closeButton:
            "!border-neutral-300 !text-neutral-600 hover:!text-neutral-900 !bg-white",
          success:
            "!bg-white !border-emerald-600/40 !text-neutral-900",
          error:
            "!bg-white !border-red-600/40 !text-neutral-900",
          warning:
            "!bg-white !border-amber-600/40 !text-neutral-900",
          info:
            "!bg-white !border-primary-600/40 !text-neutral-900",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
