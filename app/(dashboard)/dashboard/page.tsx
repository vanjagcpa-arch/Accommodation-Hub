import {
  Building2,
  CheckCircle2,
  CircleDot,
  Wrench,
  ClipboardList,
  Zap,
  ArrowRight,
  TrendingUp,
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

const recentMaintenance = [
  { id: 'm1', title: 'Water damage - ceiling stain', property: 'Unit 301 · Parkview Apts', priority: 'urgent' as MaintenancePriority, status: 'in_progress' as MaintenanceStatus, due: '22 Jun 2026' },
  { id: 'm2', title: 'Air conditioner not cooling', property: 'Unit 101 · Parkview Apts', priority: 'high' as MaintenancePriority, status: 'new' as MaintenanceStatus, due: '25 Jun 2026' },
  { id: 'm3', title: 'Broken window lock', property: 'Unit 501 · Monash Towers', priority: 'high' as MaintenancePriority, status: 'scheduled' as MaintenanceStatus, due: '26 Jun 2026' },
  { id: 'm4', title: 'Leaking tap in bathroom', property: 'Unit 1A · University Gardens', priority: 'medium' as MaintenancePriority, status: 'assigned' as MaintenanceStatus, due: '27 Jun 2026' },
  { id: 'm5', title: 'Dishwasher leaking', property: 'Unit G02 · Brunswick Studios', priority: 'high' as MaintenancePriority, status: 'waiting_parts' as MaintenanceStatus, due: '28 Jun 2026' },
]

const recentApplications = [
  { id: 'a1', applicant: 'Mei Lin Chen', email: 'meilin.chen@student.unimelb.edu.au', property: 'Unit 102 · Parkview Apts', moveIn: '1 Jul 2026', status: 'reviewing' as ApplicationStatus, agent: 'CBD Referrals' },
  { id: 'a2', applicant: 'Arjun Patel', email: 'arjun.p@student.rmit.edu.au', property: 'Unit 1B · University Gardens', moveIn: '1 Jul 2026', status: 'new' as ApplicationStatus, agent: 'Direct' },
  { id: 'a3', applicant: 'Sophie Thompson', email: 'sophie.t@student.monash.edu', property: 'Unit B01 · Hawthorn Court', moveIn: '1 Aug 2026', status: 'approved' as ApplicationStatus, agent: 'Suburban Lets' },
  { id: 'a4', applicant: 'Hamid Rashidi', email: 'h.rashidi@student.vu.edu.au', property: 'Unit 101 · Footscray Heights', moveIn: '25 Jun 2026', status: 'new' as ApplicationStatus, agent: 'Direct' },
]

const occupancyRate = Math.round((stats.occupied_properties / stats.total_properties) * 100)

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Good morning, Alex</h1>
          <p className="text-slate-500 mt-0.5">Thursday, 19 June 2026 · Metro Student Housing</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-semibold text-green-700">{occupancyRate}% Occupancy</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Properties"
          value={stats.total_properties}
          icon={Building2}
          iconColor="text-slate-600"
          iconBg="bg-slate-100"
          className="xl:col-span-1"
        />
        <StatCard
          title="Occupied"
          value={stats.occupied_properties}
          subtitle={`${occupancyRate}% occupancy rate`}
          icon={CheckCircle2}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          className="xl:col-span-1"
        />
        <StatCard
          title="Vacant"
          value={stats.vacant_properties}
          subtitle="Available now"
          icon={CircleDot}
          iconColor="text-green-600"
          iconBg="bg-green-50"
          className="xl:col-span-1"
        />
        <StatCard
          title="Open Maintenance"
          value={stats.open_maintenance_jobs}
          subtitle="2 urgent"
          icon={Wrench}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
          className="xl:col-span-1"
        />
        <StatCard
          title="Pending Applications"
          value={stats.pending_applications}
          icon={ClipboardList}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          className="xl:col-span-1"
        />
        <StatCard
          title="Electricity Pending"
          value={stats.electricity_pending}
          subtitle="Awaiting consent"
          icon={Zap}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          className="xl:col-span-1"
        />
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Maintenance */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Maintenance Jobs</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  {stats.open_maintenance_jobs} open jobs
                </p>
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
                    <TableCell className="max-w-[180px]">
                      <Link href={`/maintenance/${job.id}`} className="hover:text-green-600">
                        <p className="font-medium text-slate-900 truncate text-sm">{job.title}</p>
                        <p className="text-xs text-slate-400 truncate">{job.property}</p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <MaintenancePriorityBadge priority={job.priority} />
                    </TableCell>
                    <TableCell>
                      <MaintenanceStatusBadge status={job.status} />
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{job.due}</TableCell>
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
                <p className="text-xs text-slate-400 mt-0.5">
                  {stats.pending_applications} pending review
                </p>
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
                      <p className="font-medium text-slate-900 truncate text-sm">{app.applicant}</p>
                      <p className="text-xs text-slate-400 truncate">{app.agent}</p>
                    </TableCell>
                    <TableCell className="max-w-[140px]">
                      <p className="text-sm text-slate-700 truncate">{app.property}</p>
                    </TableCell>
                    <TableCell>
                      <ApplicationStatusBadge status={app.status} />
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{app.moveIn}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link href="/maintenance/new">
              <div className="flex flex-col items-center gap-2 p-4 border border-slate-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-colors cursor-pointer group">
                <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100">
                  <Wrench className="h-5 w-5 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-slate-700 text-center">New Maintenance Job</span>
              </div>
            </Link>
            <Link href="/applications/new">
              <div className="flex flex-col items-center gap-2 p-4 border border-slate-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-colors cursor-pointer group">
                <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100">
                  <ClipboardList className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-slate-700 text-center">New Application</span>
              </div>
            </Link>
            <Link href="/availability">
              <div className="flex flex-col items-center gap-2 p-4 border border-slate-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-colors cursor-pointer group">
                <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100">
                  <Building2 className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-slate-700 text-center">View Availability</span>
              </div>
            </Link>
            <Link href="/electricity">
              <div className="flex flex-col items-center gap-2 p-4 border border-slate-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-colors cursor-pointer group">
                <div className="p-2 bg-amber-50 rounded-lg group-hover:bg-amber-100">
                  <Zap className="h-5 w-5 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-slate-700 text-center">Electricity Accounts</span>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
