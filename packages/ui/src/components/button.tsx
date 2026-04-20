import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2Icon } from "lucide-react"
import { Slot } from "radix-ui"

import { cn } from "@workspace/ui/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-transparent bg-clip-padding text-base font-medium whitespace-nowrap transition transition-all duration-300 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        primary:
          "bg-primary/10 text-primary hover:bg-primary/20 aria-expanded:bg-primary/20 aria-expanded:text-primary",
        outline:
          "border-secondary bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "text-primary hover:bg-transparent hover:text-current/75 dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:ps-2 has-data-[icon=inline-start]:pe-2 text-sm",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
        md: "h-11 gap-1 rounded-[min(var(--radius-md),10px)] px-4 text-sm in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-14 gap-1.5 px-8 has-data-[icon=inline-end]:ps-2 has-data-[icon=inline-start]:pe-2",
        icon: "h-8 w-8 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const spinnerSizeClass: Record<
  NonNullable<VariantProps<typeof buttonVariants>["size"]>,
  string
> = {
  default: "size-4",
  xs: "size-3",
  sm: "size-3.5",
  md: "size-3.5",
  lg: "size-5",
  icon: "size-5",
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  const isLoading = Boolean(loading)
  const showSpinner = isLoading && !asChild

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={showSpinner ? "" : undefined}
      disabled={asChild ? disabled : Boolean(disabled || isLoading)}
      aria-busy={isLoading || undefined}
      className={cn(
        buttonVariants({ variant, size, className }),
        isLoading && !asChild && "cursor-wait"
      )}
      {...props}
    >
      {showSpinner && (
        <Loader2Icon
          className={cn(
            spinnerSizeClass[size ?? "default"],
            "shrink-0 animate-spin"
          )}
          aria-hidden
        />
      )}
      <>{children}</>
    </Comp>
  )
}

export { Button, buttonVariants }
