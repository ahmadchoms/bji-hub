import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-md font-medium whitespace-nowrap transition-all duration-150 ease-in-out outline-none select-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary-600 text-white shadow-sm shadow-primary-900/10 hover:bg-primary-700 hover:shadow-md hover:shadow-primary-900/20 active:bg-primary-800",
        primary:
          "bg-primary-600 text-white shadow-sm shadow-primary-900/10 hover:bg-primary-700 hover:shadow-md hover:shadow-primary-900/20 active:bg-primary-800",
        secondary:
          "bg-surface-base border border-primary-600/20 text-primary-600 shadow-2xs hover:bg-primary-50/50 hover:border-primary-600/40 active:bg-primary-100/50",
        accent:
          "bg-accent-500 text-white shadow-sm shadow-accent-900/10 hover:bg-accent-600 hover:shadow-md hover:shadow-accent-900/20 active:bg-accent-700",
        outline:
          "border border-neutral-200/80 bg-surface-base text-neutral-800 shadow-2xs hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-900 active:bg-neutral-100",
        ghost:
          "bg-transparent text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-900 active:bg-neutral-200/60",
        destructive:
          "bg-status-error text-white shadow-sm shadow-red-900/10 hover:bg-red-600 hover:shadow-md active:bg-red-700",
        link: "text-primary-600 underline-offset-4 hover:underline hover:text-primary-700",
      },
      size: {
        default:
          "h-10 min-h-[40px] px-4 py-2 text-xs font-semibold tracking-wide gap-2",
        md: "h-10 min-h-[40px] px-4 py-2 text-xs font-semibold tracking-wide gap-2",
        sm: "h-8 min-h-[32px] px-3 text-xs gap-1.5 rounded-md",
        lg: "h-11 min-h-[44px] px-5 text-sm gap-2.5 rounded-lg",
        icon: "size-10 min-w-[40px] min-h-[40px] rounded-md",
        "icon-sm": "size-8 min-w-[32px] min-h-[32px] rounded-md",
        "icon-lg": "size-11 min-w-[44px] min-h-[44px] rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

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
  );
}

export { Button, buttonVariants };
