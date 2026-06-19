import { cn } from '@/lib/utils'
import type { PropertyStatus, MaintenancePriority, MaintenanceStatus, ApplicationStatus, ElectricityStatus } from '@/types'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'gray'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  dot?: boolean
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-muted text-ink-muted border-line',
  success: 'bg-green-50 text-green-700 border-green-200/70',
  warning: 'bg-amber-50 text-amber-700 border-amber-200/70',
  danger: 'bg-red-50 text-red-700 border-red-200/70',
  info: 'bg-blue-50 text-blue-700 border-blue-200/70',
  purple: 'bg-violet-50 text-violet-700 border-violet-200/70',
  gray: 'bg-surface-muted text-ink-subtle border-line',
}

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-ink-faint',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  purple: 'bg-violet-500',
  gray: 'bg-ink-faint',
}

export function Badge({ children, variant = 'default', dot = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotStyles[variant])} />}
      {children}
    </span>
  )
}

export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  const config: Record<PropertyStatus, { label: string; variant: BadgeVariant }> = {
    available: { label: 'Available', variant: 'success' },
    occupied: { label: 'Occupied', variant: 'info' },
    on_hold: { label: 'On Hold', variant: 'warning' },
    maintenance_hold: { label: 'Maintenance Hold', variant: 'danger' },
    coming_soon: { label: 'Coming Soon', variant: 'purple' },
    unavailable: { label: 'Unavailable', variant: 'gray' },
  }
  const { label, variant } = config[status] ?? { label: status, variant: 'default' as const }
  return <Badge variant={variant} dot>{label}</Badge>
}

export function MaintenancePriorityBadge({ priority }: { priority: MaintenancePriority }) {
  const config: Record<MaintenancePriority, { label: string; variant: BadgeVariant }> = {
    urgent: { label: 'Urgent', variant: 'danger' },
    high: { label: 'High', variant: 'warning' },
    medium: { label: 'Medium', variant: 'info' },
    low: { label: 'Low', variant: 'gray' },
  }
  const { label, variant } = config[priority] ?? { label: priority, variant: 'default' as const }
  return <Badge variant={variant} dot>{label}</Badge>
}

export function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  const config: Record<MaintenanceStatus, { label: string; variant: BadgeVariant }> = {
    new: { label: 'New', variant: 'info' },
    triage: { label: 'Triage', variant: 'purple' },
    assigned: { label: 'Assigned', variant: 'default' },
    scheduled: { label: 'Scheduled', variant: 'default' },
    in_progress: { label: 'In Progress', variant: 'warning' },
    waiting_tenant: { label: 'Waiting on Tenant', variant: 'warning' },
    waiting_access: { label: 'Waiting on Access', variant: 'warning' },
    waiting_parts: { label: 'Waiting on Parts', variant: 'warning' },
    waiting_quote: { label: 'Waiting on Quote', variant: 'warning' },
    waiting_approval: { label: 'Waiting on Approval', variant: 'warning' },
    completed: { label: 'Completed', variant: 'success' },
    closed: { label: 'Closed', variant: 'gray' },
    cancelled: { label: 'Cancelled', variant: 'gray' },
    duplicate: { label: 'Duplicate', variant: 'gray' },
  }
  const { label, variant } = config[status] ?? { label: status, variant: 'default' as const }
  return <Badge variant={variant} dot>{label}</Badge>
}

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const config: Record<ApplicationStatus, { label: string; variant: BadgeVariant }> = {
    new: { label: 'New', variant: 'info' },
    reviewing: { label: 'Reviewing', variant: 'purple' },
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'danger' },
    withdrawn: { label: 'Withdrawn', variant: 'gray' },
    moved_in: { label: 'Moved In', variant: 'success' },
  }
  const { label, variant } = config[status] ?? { label: status, variant: 'default' as const }
  return <Badge variant={variant} dot>{label}</Badge>
}

export function ElectricityStatusBadge({ status }: { status: ElectricityStatus }) {
  const config: Record<ElectricityStatus, { label: string; variant: BadgeVariant }> = {
    not_required: { label: 'Not Required', variant: 'gray' },
    pending_consent: { label: 'Pending Consent', variant: 'warning' },
    pending_setup: { label: 'Pending Setup', variant: 'purple' },
    active: { label: 'Active', variant: 'success' },
    closed: { label: 'Closed', variant: 'gray' },
  }
  const { label, variant } = config[status] ?? { label: status, variant: 'default' as const }
  return <Badge variant={variant} dot>{label}</Badge>
}
