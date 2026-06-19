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
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  badge?: string | number
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Reporting', href: '/reporting', icon: BarChart3 },
    ],
  },
  {
    label: 'Portfolio',
    items: [
      { name: 'Buildings', href: '/buildings', icon: Hotel },
      { name: 'Properties', href: '/properties', icon: Building2 },
      { name: 'Availability', href: '/availability', icon: CalendarDays },
    ],
  },
  {
    label: 'Leasing',
    items: [
      { name: 'Applications', href: '/applications', icon: ClipboardList, badge: 4 },
      { name: 'Tenants', href: '/tenants', icon: User },
      { name: 'Agents', href: '/agents', icon: Users },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Maintenance', href: '/maintenance', icon: Wrench, badge: 6 },
      { name: 'Electricity', href: '/electricity', icon: Zap },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Integrations', href: '/integrations', icon: Link2 },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
}
