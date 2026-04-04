import * as React from "react"
import { cn } from "../utils/cn"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-slate-300 ml-1">
            {label}
          </label>
        ) }
        <input
          ref={ref}
          className={cn(
            'flex h-12 w-full rounded-xl border-2 border-slate-800 bg-slate-900 px-4 py-2 text-slate-100 placeholder:text-slate-500 transition-all focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/10',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-red-500 ml-1 mt-1 font-medium">{error}</span>}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
