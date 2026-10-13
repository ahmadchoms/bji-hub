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
        success: <CircleCheckIcon className="size-4.5 text-[#2F6D4F]" />,
        info: <InfoIcon className="size-4.5 text-[#512615]" />,
        warning: <TriangleAlertIcon className="size-4.5 text-[#C08552]" />,
        error: <OctagonXIcon className="size-4.5 text-[#DC2626]" />,
        loading: <Loader2Icon className="size-4.5 animate-spin text-[#512615]" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group font-sans text-xs sm:text-sm shadow-md rounded-sm border border-neutral-300 bg-surface-base text-neutral-900 p-4 gap-3",
          title: "font-semibold text-neutral-900 text-sm",
          description: "text-neutral-600 text-xs mt-0.5 leading-relaxed",
          actionButton:
            "!bg-primary-600 !text-white hover:!bg-primary-700 text-xs px-3 py-1.5 rounded-sm font-medium transition-colors",
          cancelButton:
            "!bg-neutral-100 !text-neutral-700 hover:!bg-neutral-200 text-xs px-3 py-1.5 rounded-sm transition-colors",
          closeButton:
            "!border-neutral-300 !text-neutral-500 hover:!text-neutral-900 !bg-surface-base",
          success:
            "!bg-[#F4F9F6] !border-[#BBE1CE] !text-[#1E4B36]",
          error:
            "!bg-[#FDF3F2] !border-[#F6C3BF] !text-[#991B1B]",
          warning:
            "!bg-[#FDF9F3] !border-[#F0D5BE] !text-[#8A5A2E]",
          info:
            "!bg-[#FBF6F3] !border-[#E8D4C8] !text-[#3D1D10]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
