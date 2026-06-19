import { cn } from '@/lib/utils'
import { type LabelHTMLAttributes } from 'react'

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export function Label({ children, required, className, ...props }: LabelProps) {
  return (
    <label
      className={cn('mb-1.5 block text-[13px] font-medium text-ink', className)}
      {...props}
    >
      {children}
      {required && <span className="ml-0.5 text-neg">*</span>}
    </label>
  )
}
