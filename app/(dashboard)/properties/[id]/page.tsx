import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Plus, Wrench } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getPropertyMaintenanceHistory } from '@/lib/maintenance/queries'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  PropertyStatusBadge,
  MaintenancePriorityBadge,
  MaintenanceStatusBadge,
} from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import type { Property } from '@/types'

export const dynamic = 'force-dynamic'

async function getProperty(id: string): Promise<{ property: Property | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        building:buildings(id, name, address),
        assigned_manager:profiles(id, full_name)
      `)
      .eq('id', id)
      .maybeSingle()
    if (error) return { property: null, error: error.message }
    return { property: data as unknown as Property | null, error: null }
  } catch (err) {
    return { property: null, error: err instanceof Error ? err.message : 'Failed to load property' }
  }
}

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'lease', label: 'Lease' },
  { key: 'electricity', label: 'Electricity' },
] as const

export default async function PropertyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string | string[] }>
}) {
  const { id } = await params
  const sp = await searchParams
  const activeTab = (Array.isArray(sp.tab) ? sp.tab[0] : sp.tab) ?? 'overview'

  const [{ property, error }, maintenanceData] = await Promise.all([
    getProperty(id),
    activeTab === 'maintenance' ? getPropertyMaintenanceHistory(id) : Promise.resolve(null),
  ])

  // Supabase not configured yet
  if (error && (error.includes('connect') || error.includes('relation') || error.includes('Failed'))) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Link href="/properties" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to Properties
        </Link>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Property details require Supabase — configure credentials and run migrations to enable this view.
        </div>
      </div>
    )
  }

  if (!property) notFound()

  const building = (property.building as any) ?? null
  const manager = (property.assigned_manager as any) ?? null

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back + header */}
      <div>
        <Link href="/properties" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-3">
          <ArrowLeft className="h-4 w-4" /> Back to Properties
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-ink">Unit {property.unit_number}</h1>
            <p className="text-sm text-ink-muted mt-0.5">
              {building?.name ?? 'Unknown building'}
              {building?.address ? ` · ${building.address}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PropertyStatusBadge status={property.status} />
            <Link href={`/maintenance/new?property_id=${property.id}`}>
              <Button variant="outline" size="sm">
                <Wrench className="h-3.5 w-3.5 mr-1" />Log Job
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-line">
        {TABS.map(t => (
          <Link
            key={t.key}
            href={`/properties/${id}?tab=${t.key}`}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              activeTab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Property Details</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-3">
                {([
                  ['Type', property.property_type ?? '—'],
                  ['Bedrooms', property.bedrooms === 0 ? 'Studio' : property.bedrooms],
                  ['Bathrooms', property.bathrooms],
                  ['Floor', property.floor_level ?? '—'],
                  ['Size', property.size_sqm ? `${property.size_sqm} m²` : '—'],
                  ['Weekly Rent', property.rent_amount ? formatCurrency(property.rent_amount) : '—'],
                  ['Bond', property.bond_amount ? formatCurrency(property.bond_amount) : '—'],
                  ['Manager', manager?.full_name ?? '—'],
                  ['Agent Visible', property.agent_visible ? 'Yes' : 'No'],
                ] as [string, string | number][]).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <dt className="text-ink-muted">{label}</dt>
                    <dd className="font-medium text-ink">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {(property.notes || property.internal_notes) && (
            <Card>
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {property.notes && (
                  <p className="text-sm text-ink-muted whitespace-pre-wrap">{property.notes}</p>
                )}
                {property.internal_notes && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                    <p className="text-xs font-medium text-amber-700 mb-1">Internal</p>
                    <p className="text-sm text-amber-800 whitespace-pre-wrap">{property.internal_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Maintenance */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-muted">
              {maintenanceData
                ? `${maintenanceData.open.length} open · ${maintenanceData.history.length} completed`
                : ''}
            </p>
            <Link href={`/maintenance/new?property_id=${property.id}`}>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Job</Button>
            </Link>
          </div>

          {maintenanceData?.error ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
              {maintenanceData.error.includes('relation') || maintenanceData.error.includes('connect')
                ? 'Configure Supabase to view maintenance history.'
                : maintenanceData.error}
            </div>
          ) : (
            <>
              {(maintenanceData?.open.length ?? 0) > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-ink">Open Jobs</h2>
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Job</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Assigned To</TableHead>
                            <TableHead>Due</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {maintenanceData!.open.map(job => (
                            <TableRow
                              key={job.id}
                              onClick={() => { window.location.href = `/maintenance/${job.id}` }}
                            >
                              <TableCell className="max-w-[200px]">
                                <p className="font-medium text-ink truncate">{job.title}</p>
                                {job.job_number && (
                                  <p className="text-xs font-mono text-ink-subtle">{job.job_number}</p>
                                )}
                              </TableCell>
                              <TableCell><MaintenancePriorityBadge priority={job.priority} /></TableCell>
                              <TableCell><MaintenanceStatusBadge status={job.status} /></TableCell>
                              <TableCell className="text-ink-muted text-sm">
                                {(job.assigned_staff as any)?.full_name ?? '—'}
                              </TableCell>
                              <TableCell className="text-ink-muted text-xs">{job.due_date ?? '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-ink">History</h2>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Job</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Completed</TableHead>
                          <TableHead>Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(maintenanceData?.history.length ?? 0) === 0 ? (
                          <TableEmpty message="No completed jobs for this property." colSpan={5} />
                        ) : maintenanceData!.history.map(job => (
                          <TableRow
                            key={job.id}
                            onClick={() => { window.location.href = `/maintenance/${job.id}` }}
                          >
                            <TableCell className="max-w-[200px]">
                              <p className="font-medium text-ink truncate">{job.title}</p>
                              {job.job_number && (
                                <p className="text-xs font-mono text-ink-subtle">{job.job_number}</p>
                              )}
                            </TableCell>
                            <TableCell className="text-ink-muted text-sm">
                              {(job.category as any)?.name ?? '—'}
                            </TableCell>
                            <TableCell><MaintenanceStatusBadge status={job.status} /></TableCell>
                            <TableCell className="text-ink-muted text-xs">
                              {job.completed_at
                                ? new Date(job.completed_at).toLocaleDateString('en-AU')
                                : '—'}
                            </TableCell>
                            <TableCell className="text-ink-muted text-sm">
                              {job.actual_cost ? formatCurrency(job.actual_cost) : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* Lease */}
      {activeTab === 'lease' && (
        <div className="rounded-xl border border-line bg-surface px-5 py-10 text-center text-sm text-ink-subtle">
          Lease management coming soon.
        </div>
      )}

      {/* Electricity */}
      {activeTab === 'electricity' && (
        <div className="rounded-xl border border-line bg-surface px-5 py-10 text-center text-sm text-ink-subtle">
          Electricity accounts are managed in the{' '}
          <Link href="/electricity" className="text-primary hover:underline">Electricity module</Link>.
        </div>
      )}
    </div>
  )
}
