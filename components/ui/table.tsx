import { cn } from '@/lib/utils'
import { ChevronsUpDown } from 'lucide-react'

interface TableProps {
  children?: React.ReactNode
  className?: string
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="w-full overflow-x-auto scrollbar-thin">
      <table className={cn('w-full text-sm', className)}>{children}</table>
    </div>
  )
}

export function TableHeader({ children, className }: TableProps) {
  return (
    <thead className={cn('border-b border-line bg-surface-muted/60', className)}>
      {children}
    </thead>
  )
}

export function TableBody({ children, className }: TableProps) {
  return <tbody className={cn('divide-y divide-line', className)}>{children}</tbody>
}

export function TableRow({ children, className, onClick }: TableProps & { onClick?: () => void }) {
  return (
    <tr
      className={cn(
        'group transition-colors hover:bg-surface-muted',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

export function TableHead({
  children,
  className,
  sortable,
}: TableProps & { sortable?: boolean }) {
  return (
    <th
      className={cn(
        'px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-subtle whitespace-nowrap',
        className
      )}
    >
      {sortable ? (
        <span className="inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-ink-muted">
          {children}
          <ChevronsUpDown className="h-3 w-3 text-ink-faint" />
        </span>
      ) : (
        children
      )}
    </th>
  )
}

export function TableCell({ children, className, colSpan }: TableProps & { colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={cn('px-4 py-3 text-ink-muted whitespace-nowrap align-middle', className)}>
      {children}
    </td>
  )
}

export function TableEmpty({ message = 'No records found.', colSpan = 8 }: { message?: string; colSpan?: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-14 text-center text-sm text-ink-subtle">
        {message}
      </td>
    </tr>
  )
}
