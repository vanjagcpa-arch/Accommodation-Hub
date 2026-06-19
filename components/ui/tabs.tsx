'use client'

import { cn } from '@/lib/utils'
import { useState } from 'react'

interface Tab {
  id: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  onChange?: (id: string) => void
  className?: string
}

export function Tabs({ tabs, defaultTab, onChange, className }: TabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id)

  const handleClick = (id: string) => {
    setActive(id)
    onChange?.(id)
  }

  return (
    <div className={cn('flex gap-1 border-b border-slate-200', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleClick(tab.id)}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
            active === tab.id
              ? 'border-green-600 text-green-700'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                'inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-semibold',
                active === tab.id
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-500'
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

interface TabsPanelProps {
  tabs: Tab[]
  defaultTab?: string
  children: (activeTab: string) => React.ReactNode
  className?: string
}

export function TabsWithContent({ tabs, defaultTab, children, className }: TabsPanelProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id)

  return (
    <div className={className}>
      <Tabs tabs={tabs} defaultTab={active} onChange={setActive} />
      <div className="mt-4">{children(active)}</div>
    </div>
  )
}
