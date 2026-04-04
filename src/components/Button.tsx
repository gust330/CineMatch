import * as React from "react"
import { cn } from "../utils/cn"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glow';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-teal-500 text-black font-bold hover:bg-teal-400 shadow-lg shadow-teal-500/20',
      secondary: 'bg-white/10 text-white backdrop-blur-md hover:bg-white/20 border border-white/10',
      outline: 'border-2 border-teal-500/50 text-teal-400 hover:bg-teal-500/10 hover:border-teal-400',
      ghost: 'text-slate-400 hover:text-teal-400 hover:bg-white/5',
      danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20',
      glow: 'bg-teal-500 text-black font-bold hover:bg-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.4)] hover:shadow-[0_0_25px_rgba(20,184,166,0.6)]'
    }

    const sizes = {
      sm: 'px-4 py-1.5 text-xs tracking-wide uppercase',
      md: 'px-6 py-2.5 text-sm font-semibold',
      lg: 'px-8 py-4 text-base font-bold tracking-tight',
      icon: 'p-2.5',
    }

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-full transition-all duration-300 active:scale-95 disabled:opacity-40 disabled:active:scale-100 cursor-pointer',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
