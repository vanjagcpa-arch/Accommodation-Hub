'use client'

import { Bell, Search, ChevronRight, Command } from 'lucide-react'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { MobileNav } from '@/components/layout/mobile-nav'
import AssistantTrigger from '@/components/ai/assistant-trigger'

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  reporting: 'Reporting',
  buildings: 'Buildings',
  properties: 'Properties',
  availability: 'Availability',
  applications: 'Applications',
  tenants: 'Tenants',
  agents: 'Agents',
  maintenance: 'Maintenance',
  electricity: 'Electricity',
  integrations: 'Integrations',
  settings: 'Settings',
  new: 'New',
}

function labelFor(segment: string) {
  return (
    ROUTE_LABELS[segment] ??
    segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
  )
}

export function Header() {
  const pathname = usePathname()
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const segments = pathname.split('/').filter(Boolean)

  const notifications = [
    { id: 1, text: 'New maintenance job: AC not cooling — Unit 101', time: '5m ago', unread: true },
    { id: 2, text: 'Application approved: Wei Zhang → Unit 102', time: '1h ago', unread: true },
    { id: 3, text: 'Lease ending soon: Unit 201 Parkview Apartments', time: '2h ago', unread: false },
    { id: 4, text: 'Urgent job overdue: Water damage ceiling stain', time: '3h ago', unread: false },
  ]
  const unreadCount = notifications.filter((n) => n.unread).length

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line bg-surface px-5 lg:px-6">
      {/* Breadcrumb */}
      <nav className="flex min-w-0 items-center gap-1.5 text-sm">
        <MobileNav />
        <Link href="/dashboard" className="text-ink-subtle transition-colors hover:text-ink-muted">
          Home
        </Link>
        {segments.map((segment, i) => {
          const href = '/' + segments.slice(0, i + 1).join('/')
          const isLast = i === segments.length - 1
          const isId = segment.length > 12 && !ROUTE_LABELS[segment]
          return (
            <span key={href} className="flex min-w-0 items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
              {isLast ? (
                <span className="truncate font-medium text-ink">
                  {isId ? 'Detail' : labelFor(segment)}
                </span>
              ) : (
                <Link
                  href={href}
                  className="truncate text-ink-subtle transition-colors hover:text-ink-muted"
                >
                  {isId ? 'Detail' : labelFor(segment)}
                </Link>
              )}
            </span>
          )
        })}
      </nav>

      {/* Right utilities */}
      <div className="flex items-center gap-2">
        {/* AI Assistant */}
        <AssistantTrigger />

        {/* Command / search pill */}
        <button className="hidden items-center gap-2 rounded-lg border border-line bg-surface-muted px-3 py-1.5 text-sm text-ink-subtle transition-colors hover:border-line-strong hover:text-ink-muted sm:flex">
          <Search className="h-4 w-4" />
          <span>Search or jump to…</span>
          <span className="ml-2 flex items-center gap-0.5 rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-medium text-ink-subtle">
            <Command className="h-2.5 w-2.5" />K
          </span>
        </button>

        {/* Search icon (mobile) */}
        <button className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink sm:hidden">
          <Search className="h-4 w-4" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-surface" />
            )}
          </button>

          {notificationsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-surface shadow-panel">
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <h3 className="text-sm font-semibold text-ink">Notifications</h3>
                  <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary-active">
                    {unreadCount} new
                  </span>
                </div>
                <div className="max-h-80 divide-y divide-line overflow-y-auto scrollbar-thin">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="flex cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-surface-muted"
                    >
                      <span
                        className={cn(
                          'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                          n.unread ? 'bg-primary' : 'bg-line-strong'
                        )}
                      />
                      <div className="min-w-0">
                        <p className="text-[13px] leading-snug text-ink">{n.text}</p>
                        <p className="mt-0.5 text-[11px] text-ink-subtle">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-line px-4 py-2.5">
                  <button className="text-[13px] font-medium text-primary transition-colors hover:text-primary-hover">
                    View all notifications
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
