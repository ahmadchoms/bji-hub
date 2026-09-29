import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-sm font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary-600 text-white hover:bg-primary-700",
        primary: "bg-primary-600 text-white hover:bg-primary-700",
        secondary: "bg-transparent border border-primary-600 text-primary-600 hover:bg-primary-50",
        accent: "bg-accent-500 text-white hover:bg-accent-700",
        outline: "border border-neutral-300 bg-surface-base text-neutral-900 hover:bg-neutral-100",
        ghost: "bg-transparent text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900",
        destructive: "bg-status-error text-white hover:bg-red-700",
        link: "text-primary-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 min-h-[40px] px-4 py-2 text-sm gap-2",
        md: "h-10 min-h-[40px] px-4 py-2 text-sm gap-2",
        sm: "h-8 min-h-[32px] px-3 text-xs gap-1.5 rounded-sm",
        lg: "h-12 min-h-[48px] px-6 text-base gap-2.5 rounded-sm",
        icon: "size-10 min-w-[40px] min-h-[40px]",
        "icon-sm": "size-8 min-w-[32px] min-h-[32px]",
        "icon-lg": "size-12 min-w-[48px] min-h-[48px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
