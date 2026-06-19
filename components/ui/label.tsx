import { cn } from '@/lib/utils'
import { type LabelHTMLAttributes } from 'react'

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export function Label({ children, required, className, ...props }: LabelProps) {
  return (
    <label
      className={cn('block text-sm font-medium text-slate-700 mb-1', className)}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}
