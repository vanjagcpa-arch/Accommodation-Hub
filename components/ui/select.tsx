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
            'flex h-9 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm text-slate-900',
            'focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50',
            error && 'border-red-400 focus:ring-red-400',
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
        <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
