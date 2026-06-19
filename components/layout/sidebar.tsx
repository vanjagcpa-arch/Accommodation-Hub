'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  Hotel,
  CalendarDays,
  ClipboardList,
  Wrench,
  Zap,
  Users,
  User,
  BarChart3,
  Link2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Properties', href: '/properties', icon: Building2 },
  { name: 'Buildings', href: '/buildings', icon: Hotel },
  { name: 'Availability', href: '/availability', icon: CalendarDays },
  { name: 'Applications', href: '/applications', icon: ClipboardList },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Electricity', href: '/electricity', icon: Zap },
  { name: 'Agents', href: '/agents', icon: Users },
  { name: 'Tenants', href: '/tenants', icon: User },
  { name: 'Reporting', href: '/reporting', icon: BarChart3 },
  { name: 'Integrations', href: '/integrations', icon: Link2 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-white border-r border-slate-200 transition-all duration-200 shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-slate-200 shrink-0',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 bg-green-600 rounded-lg">
              <Home className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">
              Accom<span className="text-green-600">Hub</span>
            </span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard">
            <div className="flex items-center justify-center w-8 h-8 bg-green-600 rounded-lg">
              <Home className="h-4 w-4 text-white" />
            </div>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors',
            collapsed && 'hidden'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Collapsed toggle */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mt-2 mx-2 p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group',
                isActive
                  ? 'bg-green-50 text-green-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                collapsed && 'justify-center px-2'
              )}
            >
              <item.icon
                className={cn(
                  'shrink-0 h-4 w-4',
                  isActive ? 'text-green-600' : 'text-slate-400 group-hover:text-slate-600'
                )}
              />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="shrink-0 px-4 py-4 border-t border-slate-200">
          <p className="text-xs text-slate-400">AccomHub v1.0</p>
          <p className="text-xs text-slate-400">Metro Student Housing</p>
        </div>
      )}
    </aside>
  )
}
