import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import { cn } from '~/lib/utils'

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-base font-black whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Píldora primary: navy pill, full width, anchored at the bottom.
        default:
          'w-full bg-primary text-primary-foreground shadow-[0_9px_18px_rgb(0_26_77/0.16)] hover:bg-primary/90',
        outline: 'border-border bg-background hover:bg-muted hover:text-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-muted hover:text-foreground',
        destructive: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
        // Píldora secondary: underlined navy text, no background.
        link: 'text-primary underline decoration-2 underline-offset-4',
      },
      size: {
        default: "h-12 gap-2 px-[18px] [&_svg:not([class*='size-'])]:size-5",
        xs: 'h-6 gap-1 rounded-md px-2 text-xs',
        sm: 'h-7 gap-1 rounded-md px-2.5 text-xs',
        lg: 'h-9 gap-1.5 px-3',
        icon: 'size-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
