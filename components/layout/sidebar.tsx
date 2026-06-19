'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Hotel, ChevronsUpDown, LogOut, Sparkles } from 'lucide-react'
import { navGroups, isNavItemActive } from '@/lib/navigation'

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-line bg-surface">
      {/* Workspace selector */}
      <div className="px-3 pt-3 pb-2">
        <button className="flex w-full items-center gap-2.5 rounded-xl border border-line bg-surface px-2.5 py-2 text-left transition-colors hover:bg-surface-muted">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <Hotel className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink leading-tight">
              Metro Housing
            </p>
            <p className="truncate text-[11px] text-ink-subtle leading-tight">
              Operations workspace
            </p>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-ink-subtle" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-3">
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
                        isActive
                          ? 'text-primary'
                          : 'text-[#6B7280] group-hover:text-[#374151]'
                      )}
                    />
                    <span className="flex-1 truncate">{item.name}</span>
                    {item.badge !== undefined && (
                      <span
                        className={cn(
                          'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold',
                          isActive
                            ? 'bg-primary text-white'
                            : 'bg-surface-muted text-ink-subtle group-hover:bg-line'
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

      {/* Setup / promo card */}
      <div className="px-3 pb-2">
        <div className="rounded-xl border border-line bg-surface-muted p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-soft">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-[13px] font-semibold text-ink">Finish setup</p>
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-ink-muted">
            Connect Reapit and import your buildings to go live.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <div className="h-full w-2/5 rounded-full bg-primary" />
            </div>
            <span className="text-[11px] font-medium text-ink-subtle">2/5</span>
          </div>
        </div>
      </div>

      {/* User block */}
      <div className="border-t border-line px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
            AM
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink leading-tight">
              Alex Manager
            </p>
            <p className="truncate text-[11px] text-ink-subtle leading-tight">
              Administrator
            </p>
          </div>
          <form action="/api/auth/logout" method="post" className="shrink-0">
            <button
              type="submit"
              title="Sign out"
              className="rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-muted hover:text-neg"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
