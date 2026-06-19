import { cn } from '@/lib/utils'
import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            'flex h-9 w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle',
            'transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring/50',
            'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60',
            error && 'border-neg focus:border-neg focus:ring-red-200',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-neg">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
