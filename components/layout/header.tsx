'use client'

import { Bell, Search, ChevronDown, LogOut, Settings, User } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const notifications = [
    { id: 1, text: 'New maintenance job: AC not cooling - Unit 101', time: '5m ago', unread: true },
    { id: 2, text: 'Application approved: Wei Zhang → Unit 102', time: '1h ago', unread: true },
    { id: 3, text: 'Lease ending soon: Unit 201 Parkview Apartments', time: '2h ago', unread: false },
    { id: 4, text: 'Urgent job overdue: Water damage ceiling stain', time: '3h ago', unread: false },
  ]

  const unreadCount = notifications.filter((n) => n.unread).length

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 shrink-0">
      {/* Left: Title or search */}
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        {title ? (
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        ) : (
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search properties, tenants, jobs..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen)
              setUserMenuOpen(false)
            }}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-lg z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                  <span className="text-xs text-slate-500">{unreadCount} unread</span>
                </div>
              </div>
              <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      'px-4 py-3 text-sm hover:bg-slate-50 cursor-pointer',
                      n.unread && 'bg-green-50/50'
                    )}
                  >
                    <p className="text-slate-700 leading-snug">{n.text}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-slate-100">
                <button className="text-xs text-green-600 hover:text-green-700 font-medium">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setUserMenuOpen(!userMenuOpen)
              setNotificationsOpen(false)
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-green-600 text-white text-xs font-semibold">
              AM
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-slate-700 leading-none">Alex Manager</p>
              <p className="text-xs text-slate-400 mt-0.5">Admin</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-lg z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900">Alex Manager</p>
                <p className="text-xs text-slate-500">admin@metrostudenthousing.com.au</p>
              </div>
              <div className="py-1">
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <User className="h-4 w-4 text-slate-400" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  Settings
                </Link>
              </div>
              <div className="border-t border-slate-100 py-1">
                <form action="/api/auth/logout" method="post">
                  <button
                    type="submit"
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
