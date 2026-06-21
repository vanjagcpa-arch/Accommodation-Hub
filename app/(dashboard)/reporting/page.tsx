export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { TrendingUp, Users, Wrench, Building2, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { getMaintenanceAnalytics } from '@/lib/maintenance/queries'
import { getBuildings } from '@/lib/buildings/queries'
import { createClient } from '@/lib/supabase/server'

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

async function getPortfolioStats() {
  try {
    const supabase = await createClient()
    const [tenantCount] = await Promise.all([
      supabase.from('tenants').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ])
    return { activeTenants: tenantCount.count ?? 0 }
  } catch {
    return { activeTenants: 0 }
  }
}

async function getApplicationStats() {
  try {
    const supabase = await createClient()
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [allRes, statusRes] = await Promise.all([
      supabase
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', monthStart),
      supabase
        .from('applications')
        .select('status')
        .gte('created_at', monthStart),
    ])

    const statusCounts: Record<string, number> = {}
    for (const a of statusRes.data ?? []) {
      const s = a.status as string
      statusCounts[s] = (statusCounts[s] ?? 0) + 1
    }

    return {
      total: allRes.count ?? 0,
      approved: statusCounts['approved'] ?? 0,
      reviewing: (statusCounts['new'] ?? 0) + (statusCounts['reviewing'] ?? 0),
      rejected: statusCounts['rejected'] ?? 0,
    }
  } catch {
    return { total: 0, approved: 0, reviewing: 0, rejected: 0 }
  }
}

type PageProps = { searchParams: Promise<{ tab?: string }> }

export default async function ReportingPage({ searchParams }: PageProps) {
  const { tab = 'maintenance' } = await searchParams

  const [analytics, { buildings }, portfolioStats, appStats] = await Promise.all([
    tab === 'maintenance' ? getMaintenanceAnalytics() : Promise.resolve(null),
    tab === 'portfolio' ? getBuildings() : Promise.resolve({ buildings: [] }),
    tab === 'portfolio' ? getPortfolioStats() : Promise.resolve({ activeTenants: 0 }),
    tab === 'applications' ? getApplicationStats() : Promise.resolve({ total: 0, approved: 0, reviewing: 0, rejected: 0 }),
  ])

  const totalProperties = buildings.reduce((s, b) => s + (b.total_properties ?? 0), 0)
  const totalOccupied = buildings.reduce((s, b) => s + b.occupied_count, 0)
  const overallRate = totalProperties > 0 ? Math.round((totalOccupied / totalProperties) * 100) : 0

  const TABS = [
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'applications', label: 'Applications' },
  ]

  const currentMonth = new Date().toLocaleString('en-AU', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-ink">Reporting</h1>
        <p className="text-ink-muted text-sm mt-0.5">Analytics — {currentMonth}</p>
      </div>

      <div className="flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/reporting?tab=${t.id}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink'
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
                  <p className="text-xs text-ink-muted">Open Jobs</p>
                  <p className="text-2xl font-bold text-ink">
                    {analytics.byStatus.filter((s) => !CLOSED_STATUSES.has(s.status)).reduce((n, s) => n + s.count, 0)}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 rounded-lg"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
                <div>
                  <p className="text-xs text-ink-muted">Urgent</p>
                  <p className="text-2xl font-bold text-ink">
                    {analytics.byPriority.find((p) => p.priority === 'urgent')?.count ?? 0}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-50 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
                <div>
                  <p className="text-xs text-ink-muted">Completed This Month</p>
                  <p className="text-2xl font-bold text-ink">{analytics.completedThisMonth}</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-lg"><Clock className="h-5 w-5 text-blue-600" /></div>
                <div>
                  <p className="text-xs text-ink-muted">Avg Days to Close</p>
                  <p className="text-2xl font-bold text-ink">
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
                <BarChart
                  items={analytics.byStatus.map((s) => ({
                    label: s.status.replace(/_/g, ' '),
                    count: s.count,
                    color: STATUS_COLORS[s.status] ?? 'bg-slate-300',
                  }))}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Jobs by Priority</CardTitle></CardHeader>
              <CardContent>
                <BarChart
                  items={analytics.byPriority.map((p) => ({
                    label: p.priority,
                    count: p.count,
                    color: PRIORITY_COLORS[p.priority] ?? 'bg-slate-300',
                  }))}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader><CardTitle>By Building</CardTitle></CardHeader>
              <CardContent>
                <DataTable rows={analytics.byBuilding.slice(0, 10).map((b) => [b.building, String(b.count)])} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>By Category</CardTitle></CardHeader>
              <CardContent>
                <DataTable rows={analytics.byCategory.slice(0, 10).map((c) => [c.category, String(c.count)])} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Staff Workload (open)</CardTitle></CardHeader>
              <CardContent>
                <DataTable rows={analytics.byStaff.slice(0, 10).map((s) => [s.staff, `${s.open_jobs} open`])} />
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
                  <p className="text-xs text-ink-muted">Occupancy Rate</p>
                  <p className="text-2xl font-bold text-ink">{overallRate}%</p>
                  <p className="text-xs text-ink-faint">{totalOccupied}/{totalProperties} units</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-50 rounded-lg"><Users className="h-5 w-5 text-green-600" /></div>
                <div>
                  <p className="text-xs text-ink-muted">Active Tenants</p>
                  <p className="text-2xl font-bold text-ink">{portfolioStats.activeTenants}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Occupancy by Building</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {buildings.length === 0 ? (
                <p className="text-sm text-ink-muted">No buildings on record.</p>
              ) : (
                buildings.map((b) => {
                  const total = b.total_properties || 1
                  const rate = Math.round((b.occupied_count / total) * 100)
                  return (
                    <div key={b.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-ink font-medium truncate max-w-[180px]">{b.name}</span>
                        <div className="flex items-center gap-2 text-ink-muted shrink-0">
                          <span className="text-xs">{b.occupied_count}/{b.total_properties ?? '?'}</span>
                          <span className="font-semibold text-ink w-10 text-right">{rate}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-line rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${rate >= 90 ? 'bg-green-500' : rate >= 70 ? 'bg-blue-500' : 'bg-amber-400'}`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
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
                <p className="text-xs text-ink-muted">Apps This Month</p>
                <p className="text-2xl font-bold text-ink">{appStats.total}</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Applications — {currentMonth}</CardTitle>
                <p className="text-sm text-ink-muted">{appStats.total} total</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 pt-2">
                {[
                  { label: 'Approved', v: appStats.approved, color: 'text-green-600' },
                  { label: 'Pending Review', v: appStats.reviewing, color: 'text-amber-600' },
                  { label: 'Rejected', v: appStats.rejected, color: 'text-red-600' },
                ].map((i) => (
                  <div key={i.label} className="text-center p-4 rounded-xl border border-line">
                    <p className={`text-2xl font-bold ${i.color}`}>{i.v}</p>
                    <p className="text-xs text-ink-muted mt-1">{i.label}</p>
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
  const max = Math.max(...items.map((i) => i.count), 1)
  if (items.length === 0) return <p className="text-sm text-ink-muted">No data yet.</p>
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-sm text-ink-muted w-32 shrink-0 capitalize truncate">{item.label}</span>
          <div className="flex-1 h-2 bg-line rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${item.color}`}
              style={{ width: `${Math.round((item.count / max) * 100)}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-ink w-8 text-right">{item.count}</span>
        </div>
      ))}
    </div>
  )
}

function DataTable({ rows }: { rows: [string, string][] }) {
  if (rows.length === 0) return <p className="text-sm text-ink-muted">No data yet.</p>
  return (
    <div className="divide-y divide-line">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between py-2">
          <span className="text-sm text-ink truncate max-w-[60%]">{label}</span>
          <span className="text-sm font-semibold text-ink">{value}</span>
        </div>
      ))}
    </div>
  )
}
