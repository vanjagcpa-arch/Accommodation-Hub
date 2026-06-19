import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export type TileTone = 'primary' | 'info' | 'warn' | 'neg' | 'violet' | 'neutral'

const toneStyles: Record<TileTone, string> = {
  primary: 'bg-primary-soft text-primary',
  info: 'bg-blue-50 text-info',
  warn: 'bg-amber-50 text-warn',
  neg: 'bg-red-50 text-neg',
  violet: 'bg-violet-50 text-violet',
  neutral: 'bg-surface-muted text-ink-muted',
}

const sizes = {
  sm: 'h-8 w-8 rounded-lg',
  md: 'h-10 w-10 rounded-xl',
  lg: 'h-11 w-11 rounded-xl',
}

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-[22px] w-[22px]',
}

interface IconTileProps {
  icon: LucideIcon
  tone?: TileTone
  size?: keyof typeof sizes
  className?: string
}

export function IconTile({ icon: Icon, tone = 'neutral', size = 'md', className }: IconTileProps) {
  return (
    <div className={cn('flex shrink-0 items-center justify-center', sizes[size], toneStyles[tone], className)}>
      <Icon className={iconSizes[size]} />
    </div>
  )
}
