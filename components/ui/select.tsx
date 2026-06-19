import { cn } from '@/lib/utils'
import { type SelectHTMLAttributes, forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, placeholder, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            'flex h-9 w-full appearance-none rounded-lg border border-line-strong bg-surface px-3 py-2 pr-8 text-sm text-ink',
            'transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring/50',
            'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60',
            error && 'border-neg focus:border-neg focus:ring-red-200',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-ink-subtle" />
        {error && <p className="mt-1 text-xs text-neg">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
