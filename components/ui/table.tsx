import { cn } from '@/lib/utils'

interface TableProps {
  children: React.ReactNode
  className?: string
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full text-sm', className)}>
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ children, className }: TableProps) {
  return (
    <thead className={cn('border-b border-slate-200', className)}>
      {children}
    </thead>
  )
}

export function TableBody({ children, className }: TableProps) {
  return (
    <tbody className={cn('divide-y divide-slate-100', className)}>
      {children}
    </tbody>
  )
}

export function TableRow({ children, className, onClick }: TableProps & { onClick?: () => void }) {
  return (
    <tr
      className={cn(
        'group hover:bg-slate-50 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

export function TableHead({ children, className }: TableProps) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap',
        className
      )}
    >
      {children}
    </th>
  )
}

export function TableCell({ children, className }: TableProps) {
  return (
    <td className={cn('px-4 py-3 text-slate-700 whitespace-nowrap', className)}>
      {children}
    </td>
  )
}

export function TableEmpty({ message = 'No records found.', colSpan = 8 }: { message?: string; colSpan?: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-slate-400">
        {message}
      </td>
    </tr>
  )
}
