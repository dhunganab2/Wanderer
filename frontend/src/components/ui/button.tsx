import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold ring-offset-background transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 button-bounce group relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-medium hover:-translate-y-1 active:translate-y-0 hover:scale-105",
        hero: "bg-gradient-sunrise text-white hover:shadow-glow hover:scale-110 border border-white/20 backdrop-blur-sm font-bold hover:-translate-y-2 active:translate-y-0 shadow-elevation hover:animate-glow",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-medium hover:-translate-y-1 active:translate-y-0 hover:scale-105",
        outline: "border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground hover:shadow-medium hover:-translate-y-1 active:translate-y-0 hover:scale-105",
        ghost: "hover:bg-muted hover:text-foreground hover:shadow-soft hover:-translate-y-0.5 hover:scale-105",
        glass: "glass-card-elevated text-foreground hover:bg-white/20 hover:shadow-elevation backdrop-blur-2xl hover:-translate-y-1 active:translate-y-0 hover:scale-105 border border-white/20 hover:border-sunrise-coral/30",
        success: "bg-gradient-to-r from-forest-green-500 to-forest-green-600 text-white hover:shadow-glow hover:scale-105 hover:-translate-y-1 active:translate-y-0 shadow-medium",
        warning: "bg-gradient-to-r from-warm-amber-500 to-warm-amber-600 text-white hover:shadow-glow hover:scale-105 hover:-translate-y-1 active:translate-y-0 shadow-medium",
        destructive: "bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-glow hover:scale-105 hover:-translate-y-1 active:translate-y-0 shadow-medium",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80 hover:scale-105",
        premium: "bg-gradient-sunset text-white shadow-elevation hover:shadow-glow hover:scale-110 border border-white/20 backdrop-blur-sm font-bold hover:-translate-y-2 active:translate-y-0 hover:animate-glow",
        elegant: "bg-gradient-ocean text-white shadow-elevation hover:shadow-glow hover:scale-105 border border-white/10 backdrop-blur-sm font-semibold hover:-translate-y-1 active:translate-y-0",
        gradient: "bg-gradient-to-r from-sunrise-coral via-sunset-pink to-sky-blue text-white hover:shadow-glow hover:scale-110 hover:-translate-y-2 active:translate-y-0 shadow-elevation animate-gradient-shift bg-[length:200%_200%]",
        neon: "bg-transparent border-2 border-sunrise-coral text-sunrise-coral hover:bg-sunrise-coral hover:text-white hover:shadow-glow hover:scale-105 hover:-translate-y-1 active:translate-y-0",
        floating: "glass-card-elevated backdrop-blur-2xl border border-white/20 text-foreground hover:border-sunrise-coral/50 hover:shadow-elevation hover:scale-110 hover:-translate-y-2 active:translate-y-0",
      },
      size: {
        sm: "h-10 px-6 py-2 text-sm rounded-xl",
        default: "h-12 px-8 py-3 text-base rounded-2xl",
        lg: "h-16 px-12 py-4 text-lg font-bold rounded-2xl",
        xl: "h-20 px-16 py-6 text-xl font-bold rounded-3xl",
        "2xl": "h-24 px-20 py-8 text-2xl font-bold rounded-3xl",
        icon: "h-12 w-12 rounded-2xl",
        "icon-sm": "h-10 w-10 rounded-xl",
        "icon-lg": "h-16 w-16 rounded-2xl",
        "icon-xl": "h-20 w-20 rounded-3xl",
        "icon-2xl": "h-24 w-24 rounded-3xl",
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
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Add shimmer effect for gradient variants
    const shimmerVariants = ['hero', 'premium', 'gradient', 'elegant']
    const hasShimmer = shimmerVariants.includes(variant || 'default')
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {hasShimmer && (
              <div className="absolute inset-0 -top-1 -left-1 -right-1 -bottom-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity duration-500 rounded-2xl" />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {children}
            </span>
          </>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
