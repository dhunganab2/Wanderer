import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 button-bounce",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-medium",
        hero: "bg-gradient-sunrise text-white hover:shadow-glow hover:scale-105 border border-white/20 backdrop-blur-sm font-semibold",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-medium",
        outline: "border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground hover:shadow-medium",
        ghost: "hover:bg-muted hover:text-foreground",
        glass: "glass-card text-foreground hover:bg-white/20 hover:shadow-medium backdrop-blur-xl",
        success: "bg-success text-success-foreground hover:bg-success/90 hover:shadow-medium",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 hover:shadow-medium",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-medium",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
      },
      size: {
        sm: "h-9 px-4 py-2 text-sm",
        default: "h-11 px-6 py-3 text-base",
        lg: "h-14 px-8 py-4 text-lg font-semibold",
        xl: "h-16 px-12 py-5 text-xl font-bold",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9",
        "icon-lg": "h-14 w-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
