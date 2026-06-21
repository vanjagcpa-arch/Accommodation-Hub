import {
  Building2,
  Wrench,
  ClipboardList,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import {
  MaintenancePriorityBadge,
  MaintenanceStatusBadge,
  ApplicationStatusBadge,
} from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ui/progress'
import { StatusDot } from '@/components/ui/status-dot'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { OPEN_STATUSES } from '@/lib/maintenance/constants'
import type { MaintenancePriority, MaintenanceStatus, ApplicationStatus } from '@/types'

export const dynamic = 'force-dynamic'

async function getDashboardData() {
  try {
    const supabase = await createClient()
    const today = new Date().toISOString().slice(0, 10)

    const [
      propertiesRes,
      occupiedRes,
      openJobsRes,
      urgentJobsRes,
      overdueJobsRes,
      pendingAppsRes,
      electricityPendingRes,
      buildingOccupancyRes,
      recentJobsRes,
      recentAppsRes,
    ] = await Promise.all([
      supabase.from('properties').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('occupancies').select('id', { count: 'exact', head: true }).eq('is_current', true),
      supabase.from('maintenance_jobs').select('id', { count: 'exact', head: true }).in('status', OPEN_STATUSES).eq('is_active', true),
      supabase.from('maintenance_jobs').select('id', { count: 'exact', head: true }).in('status', OPEN_STATUSES).eq('is_active', true).eq('priority', 'urgent'),
      supabase.from('maintenance_jobs').select('id', { count: 'exact', head: true }).in('status', OPEN_STATUSES).eq('is_active', true).lt('due_date', today),
      supabase.from('applications').select('id', { count: 'exact', head: true }).in('status', ['new', 'reviewing']),
      supabase.from('electricity_accounts').select('id', { count: 'exact', head: true }).eq('status', 'pending_setup'),
      supabase.from('buildings').select('id, name').eq('is_active', true).order('name').limit(8),
      supabase.from('maintenance_jobs').select(`
        id, title, priority, status, due_date,
        property:properties(unit_number),
        building:buildings(name)
      `).in('status', OPEN_STATUSES).eq('is_active', true).order('created_at', { ascending: false }).limit(5),
      supabase.from('applications').select(`
        id, applicant_first_name, applicant_last_name, status, move_in_date,
        building:buildings(name),
        property:properties(unit_number),
        agent:agents(agency_name)
      `).in('status', ['new', 'reviewing', 'approved']).order('created_at', { ascending: false }).limit(5),
    ])

    // Per-building occupancy
    const buildingIds = (buildingOccupancyRes.data ?? []).map((b: any) => b.id)
    const [totalPerBuilding, occupiedPerBuilding] = await Promise.all([
      buildingIds.length > 0
        ? supabase.from('properties').select('building_id').in('building_id', buildingIds).eq('is_active', true)
        : Promise.resolve({ data: [] }),
      buildingIds.length > 0
        ? supabase.from('occupancies').select('properties!inner(building_id)').in('properties.building_id', buildingIds).eq('is_current', true)
        : Promise.resolve({ data: [] }),
    ])

    const totalMap: Record<string, number> = {}
    for (const r of (totalPerBuilding.data ?? [])) {
      const bid = (r as any).building_id
      totalMap[bid] = (totalMap[bid] ?? 0) + 1
    }
    const occupiedMap: Record<string, number> = {}
    for (const r of (occupiedPerBuilding.data ?? [])) {
      const bid = (r as any).properties?.building_id
      if (bid) occupiedMap[bid] = (occupiedMap[bid] ?? 0) + 1
    }

    const buildingsOccupancy = (buildingOccupancyRes.data ?? []).map((b: any) => ({
      id: b.id,
      name: b.name,
      total: totalMap[b.id] ?? 0,
      occupied: occupiedMap[b.id] ?? 0,
    })).filter((b: any) => b.total > 0)

    return {
      stats: {
        total_properties: propertiesRes.count ?? 0,
        occupied_properties: occupiedRes.count ?? 0,
        open_maintenance_jobs: openJobsRes.count ?? 0,
        urgent_jobs: urgentJobsRes.count ?? 0,
        overdue_jobs: overdueJobsRes.count ?? 0,
        pending_applications: pendingAppsRes.count ?? 0,
        electricity_pending: electricityPendingRes.count ?? 0,
      },
      buildingsOccupancy,
      recentJobs: (recentJobsRes.data ?? []) as any[],
      recentApps: (recentAppsRes.data ?? []) as any[],
    }
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()
  const stats = data?.stats ?? {
    total_properties: 0,
    occupied_properties: 0,
    open_maintenance_jobs: 0,
    urgent_jobs: 0,
    overdue_jobs: 0,
    pending_applications: 0,
    electricity_pending: 0,
  }
  const occupancyRate = stats.total_properties > 0
    ? Math.round((stats.occupied_properties / stats.total_properties) * 100)
    : 0

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* Welcome */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Dashboard</h1>
          <p className="mt-0.5 text-sm text-ink-muted">Live overview of your portfolio</p>
        </div>
        {occupancyRate > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 shadow-card">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-ink">{occupancyRate}%</span>
            <span className="text-sm text-ink-muted">occupancy</span>
          </div>
        )}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Properties"
          value={stats.total_properties}
          icon={Building2}
          iconTone="neutral"
          subtitle={`${stats.occupied_properties} occupied`}
        />
        <StatCard
          title="Occupancy Rate"
          value={occupancyRate > 0 ? `${occupancyRate}%` : '—'}
          icon={TrendingUp}
          iconTone="primary"
        />
        <StatCard
          title="Open Maintenance"
          value={stats.open_maintenance_jobs}
          icon={Wrench}
          iconTone="warn"
          subtitle={[
            stats.urgent_jobs > 0 && `${stats.urgent_jobs} urgent`,
            stats.overdue_jobs > 0 && `${stats.overdue_jobs} overdue`,
          ].filter(Boolean).join(' · ') || undefined}
        />
        <StatCard
          title="Pending Applications"
          value={stats.pending_applications}
          icon={ClipboardList}
          iconTone="violet"
          subtitle="Awaiting review"
        />
      </div>

      {/* Occupancy + Ops snapshot */}
      {((data?.buildingsOccupancy.length ?? 0) > 0 || stats.open_maintenance_jobs > 0) && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {(data?.buildingsOccupancy.length ?? 0) > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Portfolio Occupancy</CardTitle>
                    <p className="mt-0.5 text-[13px] text-ink-muted">Occupied rooms by building</p>
                  </div>
                  <Link href="/buildings">
                    <Button variant="ghost" size="sm">
                      All buildings <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {data!.buildingsOccupancy.map((b: any) => {
                  const pct = b.total > 0 ? Math.round((b.occupied / b.total) * 100) : 0
                  return (
                    <div key={b.id} className="flex items-center gap-4">
                      <div className="w-44 shrink-0">
                        <p className="truncate text-sm font-medium text-ink">{b.name}</p>
                        <p className="text-xs text-ink-subtle">{b.occupied} of {b.total} rooms</p>
                      </div>
                      <ProgressBar
                        value={pct}
                        showLabel
                        tone={pct >= 90 ? 'primary' : pct >= 70 ? 'info' : 'warn'}
                        className="flex-1"
                      />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Operations Snapshot</CardTitle></CardHeader>
            <CardContent className="space-y-3.5">
              <div className="flex items-center justify-between">
                <StatusDot tone="neg" label="Urgent jobs" />
                <span className="text-sm font-semibold text-ink tabular-nums">{stats.urgent_jobs}</span>
              </div>
              <div className="flex items-center justify-between">
                <StatusDot tone="warn" label="Open jobs" />
                <span className="text-sm font-semibold text-ink tabular-nums">{stats.open_maintenance_jobs}</span>
              </div>
              <div className="flex items-center justify-between">
                <StatusDot tone="neg" label="Overdue" />
                <span className="text-sm font-semibold text-ink tabular-nums">{stats.overdue_jobs}</span>
              </div>
              <div className="space-y-3.5 border-t border-line pt-3.5">
                <div className="flex items-center justify-between">
                  <StatusDot tone="warn" label="Electricity pending setup" />
                  <span className="text-sm font-semibold text-ink tabular-nums">{stats.electricity_pending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <StatusDot tone="violet" label="Pending applications" />
                  <span className="text-sm font-semibold text-ink tabular-nums">{stats.pending_applications}</span>
                </div>
              </div>
              <Link href="/maintenance" className="block pt-1">
                <Button variant="outline" size="sm" className="w-full">Open maintenance board</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tables */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Maintenance Jobs</CardTitle>
                <p className="mt-0.5 text-xs text-ink-subtle">{stats.open_maintenance_jobs} open jobs</p>
              </div>
              <Link href="/maintenance">
                <Button variant="ghost" size="sm">View all <ArrowRight className="h-3.5 w-3.5" /></Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {(data?.recentJobs.length ?? 0) === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-subtle">No open maintenance jobs.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data!.recentJobs.map((job: any) => (
                    <TableRow key={job.id}>
                      <TableCell className="max-w-[190px]">
                        <Link href={`/maintenance/${job.id}`} className="block">
                          <p className="truncate text-sm font-medium text-ink hover:text-primary">{job.title}</p>
                          <p className="truncate text-xs text-ink-subtle">
                            {job.property?.unit_number ? `Unit ${job.property.unit_number}` : ''}
                            {job.building?.name ? ` · ${job.building.name}` : ''}
                          </p>
                        </Link>
                      </TableCell>
                      <TableCell><MaintenancePriorityBadge priority={job.priority as MaintenancePriority} /></TableCell>
                      <TableCell><MaintenanceStatusBadge status={job.status as MaintenanceStatus} /></TableCell>
                      <TableCell className="text-xs text-ink-muted">{job.due_date ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Applications</CardTitle>
                <p className="mt-0.5 text-xs text-ink-subtle">{stats.pending_applications} pending review</p>
              </div>
              <Link href="/applications">
                <Button variant="ghost" size="sm">View all <ArrowRight className="h-3.5 w-3.5" /></Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {(data?.recentApps.length ?? 0) === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-subtle">No recent applications.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Move-in</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data!.recentApps.map((app: any) => (
                    <TableRow key={app.id}>
                      <TableCell className="max-w-[160px]">
                        <Link href={`/applications/${app.id}`} className="block">
                          <p className="truncate text-sm font-medium text-ink hover:text-primary">
                            {app.applicant_first_name} {app.applicant_last_name}
                          </p>
                          <p className="truncate text-xs text-ink-subtle">{app.agent?.agency_name ?? 'Direct'}</p>
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[150px]">
                        <p className="truncate text-sm text-ink-muted">
                          {app.property?.unit_number ? `Unit ${app.property.unit_number}` : ''}
                          {app.building?.name ? ` · ${app.building.name}` : ''}
                        </p>
                      </TableCell>
                      <TableCell><ApplicationStatusBadge status={app.status as ApplicationStatus} /></TableCell>
                      <TableCell className="text-xs text-ink-muted">{app.move_in_date ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {!data && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Could not load dashboard data — ensure Supabase is configured and migrations have been run.
        </div>
      )}
    </div>
  )
}
