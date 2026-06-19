import { cn } from '@/lib/utils'

type ProgressTone = 'primary' | 'info' | 'warn' | 'neg' | 'violet'

const toneFill: Record<ProgressTone, string> = {
  primary: 'bg-primary',
  info: 'bg-info',
  warn: 'bg-warn',
  neg: 'bg-neg',
  violet: 'bg-violet',
}

interface ProgressBarProps {
  value: number
  tone?: ProgressTone
  showLabel?: boolean
  className?: string
}

export function ProgressBar({
  value,
  tone = 'primary',
  showLabel = false,
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
        <div
          className={cn('h-full rounded-full transition-all', toneFill[tone])}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-9 shrink-0 text-right text-xs font-medium text-ink-muted tabular-nums">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  )
}
