import Link from 'next/link'
import { TrendingUp, Users, Wrench, Building2, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { getMaintenanceAnalytics } from '@/lib/maintenance/queries'

export const dynamic = 'force-dynamic'

const buildingOccupancy = [
  { name: 'Parkview Apts', total: 12, occupied: 9 },
  { name: 'University Gardens', total: 20, occupied: 16 },
  { name: 'Flinders House', total: 8, occupied: 6 },
  { name: 'Brunswick Studios', total: 15, occupied: 11 },
  { name: 'Fitzroy Terrace', total: 10, occupied: 8 },
  { name: 'Monash Towers', total: 24, occupied: 20 },
  { name: 'St Kilda Res.', total: 6, occupied: 4 },
  { name: 'Hawthorn Court', total: 18, occupied: 15 },
  { name: 'Docklands Point', total: 30, occupied: 24 },
  { name: 'Footscray Heights', total: 16, occupied: 12 },
]

const applicationsThisMonth = [
  { week: 'Week 1', count: 4 },
  { week: 'Week 2', count: 6 },
  { week: 'Week 3', count: 3 },
  { week: 'Week 4 (partial)', count: 2 },
]

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-400', triage: 'bg-purple-400', assigned: 'bg-slate-400',
  scheduled: 'bg-indigo-400', in_progress: 'bg-amber-400',
  waiting_tenant: 'bg-orange-300', waiting_access: 'bg-orange-400',
  waiting_parts: 'bg-orange-500', waiting_quote: 'bg-yellow-400',
  waiting_approval: 'bg-yellow-500', completed: 'bg-green-400',
  closed: 'bg-green-600', cancelled: 'bg-red-400', duplicate: 'bg-slate-300',
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-500', high: 'bg-amber-500', medium: 'bg-blue-400', low: 'bg-slate-300',
}

const CLOSED_STATUSES = new Set(['completed', 'closed', 'cancelled', 'duplicate'])

type PageProps = { searchParams: Promise<{ tab?: string }> }

export default async function ReportingPage({ searchParams }: PageProps) {
  const { tab = 'maintenance' } = await searchParams

  const analytics = tab === 'maintenance' ? await getMaintenanceAnalytics() : null

  const totalProperties = buildingOccupancy.reduce((s, b) => s + b.total, 0)
  const totalOccupied = buildingOccupancy.reduce((s, b) => s + b.occupied, 0)
  const overallRate = Math.round((totalOccupied / totalProperties) * 100)
  const totalApplications = applicationsThisMonth.reduce((s, w) => s + w.count, 0)
  const maxApps = Math.max(...applicationsThisMonth.map(w => w.count))

  const TABS = [
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'applications', label: 'Applications' },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reporting</h1>
        <p className="text-slate-500 text-sm mt-0.5">Analytics — June 2026</p>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map(t => (
          <Link
            key={t.id}
            href={`/reporting?tab=${t.id}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Maintenance tab */}
      {tab === 'maintenance' && analytics && (
        <div className="space-y-6">
          {analytics.error && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Could not load analytics — {analytics.error}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-50 rounded-lg"><Wrench className="h-5 w-5 text-orange-600" /></div>
                <div>
                  <p className="text-xs text-slate-500">Open Jobs</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {analytics.byStatus.filter(s => !CLOSED_STATUSES.has(s.status)).reduce((n, s) => n + s.count, 0)}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 rounded-lg"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
                <div>
                  <p className="text-xs text-slate-500">Urgent</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {analytics.byPriority.find(p => p.priority === 'urgent')?.count ?? 0}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-50 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
                <div>
                  <p className="text-xs text-slate-500">Completed This Month</p>
                  <p className="text-2xl font-bold text-slate-900">{analytics.completedThisMonth}</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-lg"><Clock className="h-5 w-5 text-blue-600" /></div>
                <div>
                  <p className="text-xs text-slate-500">Avg Days to Close</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {analytics.avgDaysToComplete !== null ? `${analytics.avgDaysToComplete}d` : '—'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Jobs by Status</CardTitle></CardHeader>
              <CardContent>
                <BarChart items={analytics.byStatus.map(s => ({
                  label: s.status.replace(/_/g, ' '),
                  count: s.count,
                  color: STATUS_COLORS[s.status] ?? 'bg-slate-300',
                }))} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Jobs by Priority</CardTitle></CardHeader>
              <CardContent>
                <BarChart items={analytics.byPriority.map(p => ({
                  label: p.priority,
                  count: p.count,
                  color: PRIORITY_COLORS[p.priority] ?? 'bg-slate-300',
                }))} />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader><CardTitle>By Building</CardTitle></CardHeader>
              <CardContent>
                <DataTable rows={analytics.byBuilding.slice(0, 10).map(b => [b.building, String(b.count)])} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>By Category</CardTitle></CardHeader>
              <CardContent>
                <DataTable rows={analytics.byCategory.slice(0, 10).map(c => [c.category, String(c.count)])} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Staff Workload (open)</CardTitle></CardHeader>
              <CardContent>
                <DataTable rows={analytics.byStaff.slice(0, 10).map(s => [s.staff, `${s.open_jobs} open`])} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Portfolio tab */}
      {tab === 'portfolio' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-lg"><Building2 className="h-5 w-5 text-blue-600" /></div>
                <div>
                  <p className="text-xs text-slate-500">Occupancy Rate</p>
                  <p className="text-2xl font-bold text-slate-900">{overallRate}%</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-50 rounded-lg"><Users className="h-5 w-5 text-green-600" /></div>
                <div>
                  <p className="text-xs text-slate-500">Active Tenants</p>
                  <p className="text-2xl font-bold text-slate-900">{totalOccupied}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Occupancy by Building</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {buildingOccupancy.map(b => {
                const rate = Math.round((b.occupied / b.total) * 100)
                return (
                  <div key={b.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-700 font-medium truncate max-w-[180px]">{b.name}</span>
                      <div className="flex items-center gap-2 text-slate-500 shrink-0">
                        <span className="text-xs">{b.occupied}/{b.total}</span>
                        <span className="font-semibold text-slate-900 w-10 text-right">{rate}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${rate >= 90 ? 'bg-green-500' : rate >= 70 ? 'bg-blue-500' : 'bg-amber-400'}`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Electricity Accounts Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {([
                  { label: 'Active', value: 5, cls: 'text-green-600 bg-green-50' },
                  { label: 'Pending Consent', value: 2, cls: 'text-amber-600 bg-amber-50' },
                  { label: 'Pending Setup', value: 1, cls: 'text-purple-600 bg-purple-50' },
                  { label: 'Closed', value: 1, cls: 'text-slate-500 bg-slate-50' },
                  { label: 'Not Required', value: 1, cls: 'text-slate-400 bg-slate-50' },
                ] as const).map(item => (
                  <div key={item.label} className={`p-4 rounded-xl border border-slate-200 text-center ${item.cls}`}>
                    <p className="text-2xl font-bold">{item.value}</p>
                    <p className="text-xs font-medium mt-1 opacity-80">{item.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Applications tab */}
      {tab === 'applications' && (
        <div className="space-y-6">
          <Card className="p-5 max-w-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 rounded-lg"><TrendingUp className="h-5 w-5 text-purple-600" /></div>
              <div>
                <p className="text-xs text-slate-500">Apps This Month</p>
                <p className="text-2xl font-bold text-slate-900">{totalApplications}</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Applications — June 2026</CardTitle>
                <p className="text-sm text-slate-500">{totalApplications} total</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-6 h-40 border-b border-slate-200">
                {applicationsThisMonth.map(week => {
                  const height = maxApps > 0 ? Math.round((week.count / maxApps) * 100) : 0
                  return (
                    <div key={week.week} className="flex flex-col items-center gap-2 flex-1">
                      <span className="text-sm font-semibold text-slate-700">{week.count}</span>
                      <div className="w-full bg-green-500 rounded-t-md" style={{ height: `${Math.max(height, 8)}%` }} />
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-6 mt-2">
                {applicationsThisMonth.map(week => (
                  <div key={week.week} className="flex-1 text-center">
                    <span className="text-xs text-slate-400">{week.week}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-100">
                {[{ label: 'Approved', v: 4 }, { label: 'Pending Review', v: 3 }, { label: 'Rejected', v: 1 }].map(i => (
                  <div key={i.label} className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{i.v}</p>
                    <p className="text-xs text-slate-500">{i.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function BarChart({ items }: { items: { label: string; count: number; color: string }[] }) {
  const max = Math.max(...items.map(i => i.count), 1)
  if (items.length === 0) return <p className="text-sm text-slate-400">No data yet.</p>
  return (
    <div className="space-y-2.5">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-sm text-slate-600 w-32 shrink-0 capitalize truncate">{item.label}</span>
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${item.color}`}
              style={{ width: `${Math.round((item.count / max) * 100)}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-slate-900 w-8 text-right">{item.count}</span>
        </div>
      ))}
    </div>
  )
}

function DataTable({ rows }: { rows: [string, string][] }) {
  if (rows.length === 0) return <p className="text-sm text-slate-400">No data yet.</p>
  return (
    <div className="divide-y divide-slate-100">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between py-2">
          <span className="text-sm text-slate-700 truncate max-w-[60%]">{label}</span>
          <span className="text-sm font-semibold text-slate-900">{value}</span>
        </div>
      ))}
    </div>
  )
}
