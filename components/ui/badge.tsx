import { cn } from '@/lib/utils'
import type { PropertyStatus, MaintenancePriority, MaintenanceStatus, ApplicationStatus, ElectricityStatus } from '@/types'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'gray'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    success: 'bg-green-50 text-green-700 border border-green-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-red-50 text-red-700 border border-red-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200',
    gray: 'bg-gray-100 text-gray-600 border border-gray-200',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  const config: Record<PropertyStatus, { label: string; variant: BadgeProps['variant'] }> = {
    available: { label: 'Available', variant: 'success' },
    occupied: { label: 'Occupied', variant: 'info' },
    on_hold: { label: 'On Hold', variant: 'warning' },
    maintenance_hold: { label: 'Maintenance Hold', variant: 'danger' },
    coming_soon: { label: 'Coming Soon', variant: 'purple' },
    unavailable: { label: 'Unavailable', variant: 'gray' },
  }
  const { label, variant } = config[status] ?? { label: status, variant: 'default' as const }
  return <Badge variant={variant}>{label}</Badge>
}

export function MaintenancePriorityBadge({ priority }: { priority: MaintenancePriority }) {
  const config: Record<MaintenancePriority, { label: string; variant: BadgeProps['variant'] }> = {
    urgent: { label: 'Urgent', variant: 'danger' },
    high: { label: 'High', variant: 'warning' },
    medium: { label: 'Medium', variant: 'info' },
    low: { label: 'Low', variant: 'gray' },
  }
  const { label, variant } = config[priority] ?? { label: priority, variant: 'default' as const }
  return <Badge variant={variant}>{label}</Badge>
}

export function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  const config: Record<MaintenanceStatus, { label: string; variant: BadgeProps['variant'] }> = {
    new: { label: 'New', variant: 'info' },
    triage: { label: 'Triage', variant: 'purple' },
    assigned: { label: 'Assigned', variant: 'default' },
    scheduled: { label: 'Scheduled', variant: 'default' },
    in_progress: { label: 'In Progress', variant: 'warning' },
    waiting_parts: { label: 'Waiting Parts', variant: 'warning' },
    waiting_approval: { label: 'Waiting Approval', variant: 'warning' },
    completed: { label: 'Completed', variant: 'success' },
    closed: { label: 'Closed', variant: 'gray' },
    cancelled: { label: 'Cancelled', variant: 'gray' },
  }
  const { label, variant } = config[status] ?? { label: status, variant: 'default' as const }
  return <Badge variant={variant}>{label}</Badge>
}

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const config: Record<ApplicationStatus, { label: string; variant: BadgeProps['variant'] }> = {
    new: { label: 'New', variant: 'info' },
    reviewing: { label: 'Reviewing', variant: 'purple' },
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'danger' },
    withdrawn: { label: 'Withdrawn', variant: 'gray' },
    moved_in: { label: 'Moved In', variant: 'success' },
  }
  const { label, variant } = config[status] ?? { label: status, variant: 'default' as const }
  return <Badge variant={variant}>{label}</Badge>
}

export function ElectricityStatusBadge({ status }: { status: ElectricityStatus }) {
  const config: Record<ElectricityStatus, { label: string; variant: BadgeProps['variant'] }> = {
    not_required: { label: 'Not Required', variant: 'gray' },
    pending_consent: { label: 'Pending Consent', variant: 'warning' },
    pending_setup: { label: 'Pending Setup', variant: 'purple' },
    active: { label: 'Active', variant: 'success' },
    closed: { label: 'Closed', variant: 'gray' },
  }
  const { label, variant } = config[status] ?? { label: status, variant: 'default' as const }
  return <Badge variant={variant}>{label}</Badge>
}
