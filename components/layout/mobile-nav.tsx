'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Menu, X, Hotel } from 'lucide-react'
import { navGroups, isNavItemActive } from '@/lib/navigation'

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close the drawer whenever the route changes
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-ink/30 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-line bg-surface shadow-panel">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                  <Hotel className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold text-ink">
                  Accom<span className="text-primary">Hub</span>
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-ink-subtle hover:bg-surface-muted hover:text-ink"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3">
              {navGroups.map((group) => (
                <div key={group.label} className="mb-4">
                  <p className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = isNavItemActive(pathname, item.href)
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            'group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors',
                            isActive
                              ? 'bg-primary-soft text-primary-active'
                              : 'text-[#374151] hover:bg-surface-muted hover:text-ink'
                          )}
                        >
                          <item.icon
                            className={cn(
                              'h-[17px] w-[17px] shrink-0',
                              isActive ? 'text-primary' : 'text-[#6B7280]'
                            )}
                          />
                          <span className="flex-1 truncate">{item.name}</span>
                          {item.badge !== undefined && (
                            <span
                              className={cn(
                                'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold',
                                isActive ? 'bg-primary text-white' : 'bg-surface-muted text-ink-subtle'
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </div>
  )
}
