'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Hotel, ChevronsUpDown, LogOut, Sparkles, ChevronRight } from 'lucide-react'
import { navGroups, isNavItemActive, isGroupActive } from '@/lib/navigation'
import { canAccessModule } from '@/lib/permissions'
import { logout } from '@/app/login/actions'

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrator',
  internal_manager: 'Property Manager',
  external_manager: 'External Manager',
  referral_agent: 'Referral Agent',
  maintenance_staff: 'Maintenance Staff',
  read_only: 'View Only',
}

function formatRole(role: string): string {
  return ROLE_LABELS[role] ?? role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Which href gets which dynamic badge count
const BADGE_MAP: Record<string, 'appCount' | 'mainCount'> = {
  '/applications': 'appCount',
  '/maintenance': 'mainCount',
}

interface SidebarProps {
  companyName: string
  userName: string
  userRole: string
  appCount: number
  mainCount: number
}

export function Sidebar({ companyName, userName, userRole, appCount, mainCount }: SidebarProps) {
  const pathname = usePathname()
  const counts = { appCount, mainCount }
  const visibleGroups = navGroups.filter(g => canAccessModule(userRole, g.module))

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    visibleGroups.forEach(group => {
      if (isGroupActive(pathname, group)) initial.add(group.label)
    })
    return initial
  })

  function toggleGroup(label: string) {
    setOpenGroups(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

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
              {companyName}
            </p>
            <p className="truncate text-[11px] text-ink-subtle leading-tight">
              Operations workspace
            </p>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-ink-subtle" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-3">
        <div className="space-y-0.5">
          {visibleGroups.map((group) => {
            const isOpen = openGroups.has(group.label)
            const groupActive = isGroupActive(pathname, group)

            return (
              <div key={group.label}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors',
                    groupActive && !isOpen
                      ? 'bg-primary-soft text-primary-active'
                      : 'text-[#374151] hover:bg-surface-muted hover:text-ink'
                  )}
                >
                  <group.icon
                    className={cn(
                      'h-[17px] w-[17px] shrink-0 transition-colors',
                      groupActive ? 'text-primary' : 'text-[#6B7280]'
                    )}
                  />
                  <span className="flex-1 truncate text-left">{group.label}</span>
                  <ChevronRight
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 text-ink-faint transition-transform duration-200',
                      isOpen && 'rotate-90'
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="ml-5 mt-0.5 border-l border-line pl-2 pb-1 space-y-0.5">
                    {group.items.map((item) => {
                      const itemActive = isNavItemActive(pathname, item.href, item.exact)
                      const dynamicBadgeKey = BADGE_MAP[item.href]
                      const badgeValue = dynamicBadgeKey ? counts[dynamicBadgeKey] : undefined
                      const showBadge = badgeValue !== undefined && badgeValue > 0

                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            'group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors',
                            itemActive
                              ? 'bg-primary-soft text-primary-active'
                              : 'text-[#374151] hover:bg-surface-muted hover:text-ink'
                          )}
                        >
                          <item.icon
                            className={cn(
                              'h-[15px] w-[15px] shrink-0',
                              itemActive
                                ? 'text-primary'
                                : 'text-[#6B7280] group-hover:text-[#374151]'
                            )}
                          />
                          <span className="flex-1 truncate">{item.name}</span>
                          {showBadge && (
                            <span
                              className={cn(
                                'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold',
                                itemActive
                                  ? 'bg-primary text-white'
                                  : 'bg-surface-muted text-ink-subtle group-hover:bg-line'
                              )}
                            >
                              {badgeValue}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
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
            {getInitials(userName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink leading-tight">
              {userName}
            </p>
            <p className="truncate text-[11px] text-ink-subtle leading-tight">
              {formatRole(userRole)}
            </p>
          </div>
          <form action={logout} className="shrink-0">
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
