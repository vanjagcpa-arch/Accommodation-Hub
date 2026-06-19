import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { IconTile, type TileTone } from '@/components/ui/icon-tile'
import { StatusDot, type DotTone } from '@/components/ui/status-dot'

interface BreakdownItem {
  label: string
  value: string | number
  tone?: DotTone
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  iconTone?: TileTone
  delta?: {
    value: number
    positive?: boolean
    label?: string
  }
  breakdown?: BreakdownItem[]
  className?: string
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconTone = 'neutral',
  delta,
  breakdown,
  className,
}: StatCardProps) {
  return (
    <div className={cn('rounded-xl border border-line bg-surface p-5 shadow-card', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-ink-muted">{title}</p>
        {icon && <IconTile icon={icon} tone={iconTone} size="sm" />}
      </div>

      <div className="mt-2.5 flex items-end gap-2">
        <span className="text-[28px] font-semibold leading-none tracking-tight text-ink">
          {value}
        </span>
        {delta && (
          <span
            className={cn(
              'mb-0.5 inline-flex items-center gap-0.5 text-xs font-semibold',
              delta.positive ? 'text-primary' : 'text-neg'
            )}
          >
            {delta.positive ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {Math.abs(delta.value)}%
          </span>
        )}
      </div>

      {subtitle && !breakdown && (
        <p className="mt-1.5 text-xs text-ink-subtle">{subtitle}</p>
      )}

      {delta?.label && (
        <p className="mt-1.5 text-xs text-ink-subtle">{delta.label}</p>
      )}

      {breakdown && breakdown.length > 0 && (
        <div className="mt-3.5 space-y-2 border-t border-line pt-3">
          {breakdown.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <StatusDot tone={item.tone ?? 'muted'} label={item.label} />
              <span className="text-sm font-semibold text-ink tabular-nums">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
