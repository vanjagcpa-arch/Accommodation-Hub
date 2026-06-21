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
  Gauge,
  FileText,
  CreditCard,
  Calendar,
  ListChecks,
  RefreshCw,
  Tag,
  Receipt,
  Layers,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  badge?: string | number
  exact?: boolean
}

export interface NavGroup {
  label: string
  icon: LucideIcon
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    icon: LayoutDashboard,
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Reporting', href: '/reporting', icon: BarChart3 },
    ],
  },
  {
    label: 'Portfolio',
    icon: Building2,
    items: [
      { name: 'Portfolio', href: '/portfolio', icon: Layers, exact: true },
      { name: 'Buildings', href: '/buildings', icon: Hotel },
      { name: 'Properties', href: '/properties', icon: Building2 },
      { name: 'Availability', href: '/availability', icon: CalendarDays },
    ],
  },
  {
    label: 'Leasing',
    icon: ClipboardList,
    items: [
      { name: 'Applications', href: '/applications', icon: ClipboardList },
      { name: 'Tenants', href: '/tenants', icon: User },
      { name: 'Agents', href: '/agents', icon: Users },
      { name: 'Agent Portal', href: '/agents/portal', icon: Link2 },
    ],
  },
  {
    label: 'Maintenance',
    icon: Wrench,
    items: [
      { name: 'Work Orders', href: '/maintenance', icon: Wrench, exact: true },
      { name: 'Properties', href: '/maintenance/properties', icon: Building2 },
      { name: 'My Jobs', href: '/maintenance/my-jobs', icon: ListChecks },
      { name: 'Contractors', href: '/maintenance/contractors', icon: Users },
      { name: 'Schedule', href: '/maintenance/schedule', icon: Calendar },
      { name: 'Recurring', href: '/maintenance/recurring', icon: RefreshCw },
      { name: 'Services', href: '/maintenance/services', icon: Tag },
      { name: 'Invoices', href: '/maintenance/invoices', icon: Receipt },
    ],
  },
  {
    label: 'Electricity',
    icon: Zap,
    items: [
      { name: 'Overview', href: '/electricity', icon: Zap, exact: true },
      { name: 'Tenants', href: '/electricity/tenants', icon: User },
      { name: 'Metering', href: '/electricity/metering', icon: Gauge },
      { name: 'Invoices', href: '/electricity/invoices', icon: FileText },
      { name: 'Payments', href: '/electricity/payments', icon: CreditCard },
    ],
  },
  {
    label: 'System',
    icon: Settings,
    items: [
      { name: 'Integrations', href: '/integrations', icon: Link2 },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

export function isNavItemActive(pathname: string, href: string, exact?: boolean): boolean {
  if (pathname === href) return true
  if (exact) return false
  return pathname.startsWith(href + '/')
}

export function isGroupActive(pathname: string, group: NavGroup): boolean {
  return group.items.some(item => isNavItemActive(pathname, item.href, item.exact))
}
