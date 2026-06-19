import type { MaintenanceStatus, MaintenancePriority } from '@/types'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'gray'

// Lifecycle grouping used for tabs, dashboards and "is this job still open?"
export type StatusGroup = 'open' | 'waiting' | 'done'

interface StatusMeta {
  label: string
  variant: BadgeVariant
  group: StatusGroup
}

export const STATUS_META: Record<MaintenanceStatus, StatusMeta> = {
  new:              { label: 'New',              variant: 'info',    group: 'open' },
  triage:           { label: 'Triage',           variant: 'purple',  group: 'open' },
  assigned:         { label: 'Assigned',         variant: 'default', group: 'open' },
  scheduled:        { label: 'Scheduled',        variant: 'default', group: 'open' },
  in_progress:      { label: 'In Progress',      variant: 'warning', group: 'open' },
  waiting_tenant:   { label: 'Waiting on Tenant',   variant: 'warning', group: 'waiting' },
  waiting_access:   { label: 'Waiting on Access',   variant: 'warning', group: 'waiting' },
  waiting_parts:    { label: 'Waiting on Parts',    variant: 'warning', group: 'waiting' },
  waiting_quote:    { label: 'Waiting on Quote',    variant: 'warning', group: 'waiting' },
  waiting_approval: { label: 'Waiting on Approval', variant: 'warning', group: 'waiting' },
  completed:        { label: 'Completed',        variant: 'success', group: 'done' },
  closed:           { label: 'Closed',           variant: 'gray',    group: 'done' },
  cancelled:        { label: 'Cancelled',        variant: 'gray',    group: 'done' },
  duplicate:        { label: 'Duplicate',        variant: 'gray',    group: 'done' },
}

// Ordered list for status pickers
export const STATUS_ORDER: MaintenanceStatus[] = [
  'new', 'triage', 'assigned', 'scheduled', 'in_progress',
  'waiting_tenant', 'waiting_access', 'waiting_parts', 'waiting_quote', 'waiting_approval',
  'completed', 'closed', 'cancelled', 'duplicate',
]

interface PriorityMeta {
  label: string
  variant: BadgeVariant
  /** target resolution time in hours, used for SLA hints */
  slaHours: number
}

export const PRIORITY_META: Record<MaintenancePriority, PriorityMeta> = {
  urgent: { label: 'Urgent', variant: 'danger',  slaHours: 4 },
  high:   { label: 'High',   variant: 'warning', slaHours: 24 },
  medium: { label: 'Medium', variant: 'info',    slaHours: 72 },
  low:    { label: 'Low',    variant: 'gray',    slaHours: 168 },
}

export const PRIORITY_ORDER: MaintenancePriority[] = ['urgent', 'high', 'medium', 'low']

export const OPEN_STATUSES: MaintenanceStatus[] = STATUS_ORDER.filter(
  (s) => STATUS_META[s].group !== 'done'
)

export function isOpenStatus(status: MaintenanceStatus): boolean {
  return STATUS_META[status]?.group !== 'done'
}

export function statusLabel(status: MaintenanceStatus): string {
  return STATUS_META[status]?.label ?? status
}

export function priorityLabel(priority: MaintenancePriority): string {
  return PRIORITY_META[priority]?.label ?? priority
}

/** A job is overdue when it is still open and its due date has passed. */
export function isOverdue(dueDate: string | null, status: MaintenanceStatus): boolean {
  if (!dueDate || !isOpenStatus(status)) return false
  return new Date(dueDate) < new Date(new Date().toDateString())
}
