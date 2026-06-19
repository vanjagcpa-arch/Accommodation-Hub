import {
  Building2,
  Wrench,
  ClipboardList,
  TrendingUp,
  ArrowRight,
  Zap,
  Users,
  Link2,
  X,
} from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import {
  MaintenancePriorityBadge,
  MaintenanceStatusBadge,
  ApplicationStatusBadge,
  Badge,
} from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { IconTile, type TileTone } from '@/components/ui/icon-tile'
import { ProgressBar } from '@/components/ui/progress'
import { StatusDot, type DotTone } from '@/components/ui/status-dot'
import Link from 'next/link'
import type { MaintenancePriority, MaintenanceStatus, ApplicationStatus } from '@/types'

// Mock data — will be replaced with Supabase queries
const stats = {
  total_properties: 24,
  occupied_properties: 17,
  vacant_properties: 5,
  open_maintenance_jobs: 6,
  pending_applications: 4,
  electricity_pending: 3,
}
const occupancyRate = Math.round((stats.occupied_properties / stats.total_properties) * 100)

const onboarding: {
  title: string
  description: string
  icon: typeof Link2
  tone: TileTone
  badge: { label: string; variant: 'success' | 'warning' | 'gray' }
}[] = [
  { title: 'Connect Reapit', description: 'Link your property source of truth for import-ready sync.', icon: Link2, tone: 'info', badge: { label: 'In progress', variant: 'warning' } },
  { title: 'Import buildings & rooms', description: '2,480 rooms across 25 buildings mapped and ready.', icon: Building2, tone: 'primary', badge: { label: 'Done', variant: 'success' } },
  { title: 'Invite your managers', description: 'Add internal property managers and external agents.', icon: Users, tone: 'violet', badge: { label: 'To do', variant: 'gray' } },
]

const buildingsOccupancy = [
  { name: 'Parkview Apartments', occupied: 38, total: 42 },
  { name: 'Monash Towers', occupied: 51, total: 55 },
  { name: 'University Gardens', occupied: 28, total: 40 },
  { name: 'Brunswick Studios', occupied: 19, total: 22 },
  { name: 'Hawthorn Court', occupied: 24, total: 30 },
  { name: 'Footscray Heights', occupied: 12, total: 25 },
]

const opsBreakdown: { label: string; value: number; tone: DotTone }[] = [
  { label: 'Urgent jobs', value: 2, tone: 'neg' },
  { label: 'In progress', value: 3, tone: 'warn' },
  { label: 'Scheduled', value: 4, tone: 'info' },
  { label: 'Completed this week', value: 11, tone: 'pos' },
]

const recentMaintenance = [
  { id: 'm1', title: 'Water damage - ceiling stain', property: 'Unit 301 · Parkview Apts', priority: 'urgent' as MaintenancePriority, status: 'in_progress' as MaintenanceStatus, due: '22 Jun 2026' },
  { id: 'm2', title: 'Air conditioner not cooling', property: 'Unit 101 · Parkview Apts', priority: 'high' as MaintenancePriority, status: 'new' as MaintenanceStatus, due: '25 Jun 2026' },
  { id: 'm3', title: 'Broken window lock', property: 'Unit 501 · Monash Towers', priority: 'high' as MaintenancePriority, status: 'scheduled' as MaintenanceStatus, due: '26 Jun 2026' },
  { id: 'm4', title: 'Leaking tap in bathroom', property: 'Unit 1A · University Gardens', priority: 'medium' as MaintenancePriority, status: 'assigned' as MaintenanceStatus, due: '27 Jun 2026' },
  { id: 'm5', title: 'Dishwasher leaking', property: 'Unit G02 · Brunswick Studios', priority: 'high' as MaintenancePriority, status: 'waiting_parts' as MaintenanceStatus, due: '28 Jun 2026' },
]

const recentApplications = [
  { id: 'a1', applicant: 'Mei Lin Chen', property: 'Unit 102 · Parkview Apts', moveIn: '1 Jul 2026', status: 'reviewing' as ApplicationStatus, agent: 'CBD Referrals' },
  { id: 'a2', applicant: 'Arjun Patel', property: 'Unit 1B · University Gardens', moveIn: '1 Jul 2026', status: 'new' as ApplicationStatus, agent: 'Direct' },
  { id: 'a3', applicant: 'Sophie Thompson', property: 'Unit B01 · Hawthorn Court', moveIn: '1 Aug 2026', status: 'approved' as ApplicationStatus, agent: 'Suburban Lets' },
  { id: 'a4', applicant: 'Hamid Rashidi', property: 'Unit 101 · Footscray Heights', moveIn: '25 Jun 2026', status: 'new' as ApplicationStatus, agent: 'Direct' },
]

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* Welcome */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Good morning, Alex</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Thursday, 19 June 2026 · Metro Student Housing
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 shadow-card">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-ink">{occupancyRate}%</span>
          <span className="text-sm text-ink-muted">occupancy</span>
        </div>
      </div>

      {/* Onboarding strip */}
      <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary-soft text-primary">
              <TrendingUp className="h-3 w-3" />
            </span>
            <h2 className="text-sm font-semibold text-ink">Get started with AccomHub</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-muted">
                <div className="h-full w-1/3 rounded-full bg-primary" />
              </div>
              <span className="text-xs font-medium text-ink-subtle">1/3</span>
            </div>
            <button className="text-ink-subtle transition-colors hover:text-ink-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {onboarding.map((step) => (
            <div
              key={step.title}
              className="rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong"
            >
              <div className="mb-3 flex items-center justify-between">
                <IconTile icon={step.icon} tone={step.tone} />
                <Badge variant={step.badge.variant} dot>{step.badge.label}</Badge>
              </div>
              <h3 className="text-sm font-semibold text-ink">{step.title}</h3>
              <p className="mt-1 text-[13px] leading-snug text-ink-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Properties"
          value={stats.total_properties}
          icon={Building2}
          iconTone="neutral"
          subtitle="Across 10 buildings"
        />
        <StatCard
          title="Occupancy Rate"
          value={`${occupancyRate}%`}
          icon={TrendingUp}
          iconTone="primary"
          delta={{ value: 4, positive: true, label: 'vs. last month' }}
        />
        <StatCard
          title="Open Maintenance"
          value={stats.open_maintenance_jobs}
          icon={Wrench}
          iconTone="warn"
          subtitle="2 urgent · 1 overdue"
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
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
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
            {buildingsOccupancy.map((b) => {
              const pct = Math.round((b.occupied / b.total) * 100)
              return (
                <div key={b.name} className="flex items-center gap-4">
                  <div className="w-44 shrink-0">
                    <p className="truncate text-sm font-medium text-ink">{b.name}</p>
                    <p className="text-xs text-ink-subtle">
                      {b.occupied} of {b.total} rooms
                    </p>
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

        <Card>
          <CardHeader>
            <CardTitle>Operations Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {opsBreakdown.map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <StatusDot tone={row.tone} label={row.label} />
                <span className="text-sm font-semibold text-ink tabular-nums">{row.value}</span>
              </div>
            ))}
            <div className="space-y-3.5 border-t border-line pt-3.5">
              <div className="flex items-center justify-between">
                <StatusDot tone="warn" label="Electricity pending setup" />
                <span className="text-sm font-semibold text-ink tabular-nums">{stats.electricity_pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <StatusDot tone="primary" label="Vacant & available" />
                <span className="text-sm font-semibold text-ink tabular-nums">{stats.vacant_properties}</span>
              </div>
            </div>
            <Link href="/maintenance" className="block pt-1">
              <Button variant="outline" size="sm" className="w-full">
                Open maintenance board
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Recent Maintenance */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Maintenance Jobs</CardTitle>
                <p className="mt-0.5 text-xs text-ink-subtle">{stats.open_maintenance_jobs} open jobs</p>
              </div>
              <Link href="/maintenance">
                <Button variant="ghost" size="sm">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
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
                {recentMaintenance.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="max-w-[190px]">
                      <Link href={`/maintenance/${job.id}`} className="block">
                        <p className="truncate text-sm font-medium text-ink hover:text-primary">{job.title}</p>
                        <p className="truncate text-xs text-ink-subtle">{job.property}</p>
                      </Link>
                    </TableCell>
                    <TableCell><MaintenancePriorityBadge priority={job.priority} /></TableCell>
                    <TableCell><MaintenanceStatusBadge status={job.status} /></TableCell>
                    <TableCell className="text-xs text-ink-muted">{job.due}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Applications</CardTitle>
                <p className="mt-0.5 text-xs text-ink-subtle">{stats.pending_applications} pending review</p>
              </div>
              <Link href="/applications">
                <Button variant="ghost" size="sm">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
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
                {recentApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="max-w-[160px]">
                      <p className="truncate text-sm font-medium text-ink">{app.applicant}</p>
                      <p className="truncate text-xs text-ink-subtle">{app.agent}</p>
                    </TableCell>
                    <TableCell className="max-w-[150px]">
                      <p className="truncate text-sm text-ink-muted">{app.property}</p>
                    </TableCell>
                    <TableCell><ApplicationStatusBadge status={app.status} /></TableCell>
                    <TableCell className="text-xs text-ink-muted">{app.moveIn}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
