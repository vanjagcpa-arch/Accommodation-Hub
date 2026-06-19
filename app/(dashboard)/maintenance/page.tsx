import Link from 'next/link'
import { Plus, Calendar, AlertTriangle, Wrench, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/table'
import { MaintenancePriorityBadge, MaintenanceStatusBadge, Badge } from '@/components/ui/badge'
import { getMaintenanceJobs, getMaintenanceStats, getMaintenanceFormOptions } from '@/lib/maintenance/queries'
import { isOverdue } from '@/lib/maintenance/constants'
import { cn } from '@/lib/utils'
import { JobsFilters } from './_components/jobs-filters'
import type { MaintenanceJobFilters } from '@/types'

export const dynamic = 'force-dynamic'

const TABS = [
  { id: 'open', label: 'Open' },
  { id: 'unassigned', label: 'Unassigned' },
  { id: 'completed', label: 'Completed' },
  { id: 'all', label: 'All' },
]

function buildHref(base: Record<string, string | undefined>, patch: Record<string, string | undefined>) {
  const merged = { ...base, ...patch }
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v)
  const qs = sp.toString()
  return qs ? `/maintenance?${qs}` : '/maintenance'
}

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
  const params: Record<string, string | undefined> = {
    q: first(sp.q),
    building: first(sp.building),
    status: first(sp.status),
    priority: first(sp.priority),
    category: first(sp.category),
    staff: first(sp.staff),
    due: first(sp.due),
    tab: first(sp.tab) ?? 'open',
  }
  const filters: MaintenanceJobFilters = { ...params }

  const [{ jobs, error }, stats, options] = await Promise.all([
    getMaintenanceJobs(filters),
    getMaintenanceStats(),
    getMaintenanceFormOptions(),
  ])

  const kpis = [
    { label: 'Open jobs', value: stats.open, tone: 'text-ink', href: buildHref(params, { tab: 'open', due: undefined, priority: undefined }) },
    { label: 'Urgent', value: stats.urgent, tone: stats.urgent > 0 ? 'text-neg' : 'text-ink', href: buildHref(params, { tab: 'open', priority: 'urgent', due: undefined }) },
    { label: 'Overdue', value: stats.overdue, tone: stats.overdue > 0 ? 'text-warn' : 'text-ink', href: buildHref(params, { tab: 'open', due: 'overdue', priority: undefined }) },
    { label: 'Due this week', value: stats.dueThisWeek, tone: 'text-ink', href: buildHref(params, { tab: 'open', due: 'week', priority: undefined }) },
    { label: 'Unassigned', value: stats.unassigned, tone: stats.unassigned > 0 ? 'text-info' : 'text-ink', href: buildHref(params, { tab: 'unassigned', due: undefined, priority: undefined }) },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Maintenance</h1>
          <p className="text-[13px] text-ink-muted mt-0.5">
            Repairs &amp; maintenance operations · {stats.open} open · {stats.urgent} urgent · {stats.overdue} overdue
          </p>
        </div>
        <Link href="/maintenance/new">
          <Button><Plus className="h-4 w-4" />New Request</Button>
        </Link>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} className="rounded-xl border border-line bg-surface shadow-card p-4 transition-colors hover:bg-surface-muted">
            <p className="text-xs text-ink-subtle font-medium">{k.label}</p>
            <p className={cn('text-2xl font-bold mt-1', k.tone)}>{k.value}</p>
          </Link>
        ))}
      </div>

      {/* Supabase-not-ready notice */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-warn/30 bg-warn/5 px-4 py-3">
          <Database className="h-4 w-4 text-warn mt-0.5 shrink-0" />
          <div className="text-[13px] text-ink-muted">
            <span className="font-semibold text-ink">Couldn&apos;t load jobs from Supabase.</span>{' '}
            Run <code className="text-[12px] bg-surface-muted px-1 py-0.5 rounded">002_maintenance_module.sql</code> and set real
            credentials in <code className="text-[12px] bg-surface-muted px-1 py-0.5 rounded">.env.local</code>, then reload.
            <p className="text-[12px] text-ink-faint mt-1">Details: {error}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-line">
        <div className="flex -mb-px gap-1">
          {TABS.map((t) => {
            const active = (params.tab ?? 'open') === t.id
            return (
              <Link
                key={t.id}
                href={buildHref(params, { tab: t.id })}
                className={cn(
                  'px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors',
                  active ? 'border-primary text-primary' : 'border-transparent text-ink-muted hover:text-ink hover:border-line-strong'
                )}
              >
                {t.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Filters */}
      <JobsFilters
        params={params}
        buildings={options.buildings}
        categories={options.categories}
        staff={options.staff}
      />

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length === 0 ? (
                <TableEmpty colSpan={7} message={error ? 'No data — see the notice above.' : 'No maintenance jobs match these filters.'} />
              ) : jobs.map((job) => {
                const overdue = isOverdue(job.due_date, job.status)
                return (
                  <TableRow key={job.id}>
                    <TableCell className="max-w-[260px]">
                      <Link href={`/maintenance/${job.id}`} className="block hover:text-primary">
                        <p className="font-medium text-ink text-[13px] truncate">{job.title}</p>
                        <p className="text-[11px] text-ink-faint font-mono">{job.job_number ?? '—'}</p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p className="text-[13px] text-ink">{job.property?.unit_number ? `Unit ${job.property.unit_number}` : '—'}</p>
                      <p className="text-[11px] text-ink-faint">{job.building?.name ?? '—'}</p>
                    </TableCell>
                    <TableCell>
                      {job.category?.name
                        ? <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: job.category.color ?? '#9ca3af' }} />{job.category.name}</span>
                        : <span className="text-[13px] text-ink-faint">{job.issue_type ?? '—'}</span>}
                    </TableCell>
                    <TableCell><MaintenancePriorityBadge priority={job.priority} /></TableCell>
                    <TableCell><MaintenanceStatusBadge status={job.status} /></TableCell>
                    <TableCell>
                      {job.assigned_staff?.full_name ? (
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: job.assigned_staff.color ?? '#3b82f6' }}>
                            {job.assigned_staff.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </span>
                          <span className="text-[13px] text-ink-muted">{job.assigned_staff.full_name}</span>
                        </div>
                      ) : <Badge variant="warning">Unassigned</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className={cn('flex items-center gap-1.5 text-[13px]', overdue ? 'text-neg font-medium' : 'text-ink-muted')}>
                        {overdue ? <AlertTriangle className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5 text-ink-faint" />}
                        {job.due_date ?? '—'}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {jobs.length >= 200 && (
        <p className="flex items-center gap-1.5 text-[12px] text-ink-faint"><Wrench className="h-3 w-3" />Showing the first 200 jobs. Narrow the filters to see more.</p>
      )}
    </div>
  )
}
