import { cn } from '@/lib/utils'

export type DotTone = 'pos' | 'neg' | 'warn' | 'info' | 'violet' | 'muted' | 'primary'

const toneColor: Record<DotTone, string> = {
  pos: 'bg-pos',
  neg: 'bg-neg',
  warn: 'bg-warn',
  info: 'bg-info',
  violet: 'bg-violet',
  muted: 'bg-ink-faint',
  primary: 'bg-primary',
}

interface StatusDotProps {
  tone?: DotTone
  label?: React.ReactNode
  pulse?: boolean
  className?: string
}

export function StatusDot({ tone = 'muted', label, pulse, className }: StatusDotProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
              toneColor[tone]
            )}
          />
        )}
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', toneColor[tone])} />
      </span>
      {label !== undefined && (
        <span className="text-sm text-ink-muted">{label}</span>
      )}
    </span>
  )
}
