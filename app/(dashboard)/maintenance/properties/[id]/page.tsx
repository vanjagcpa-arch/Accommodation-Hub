export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Plus, Wrench, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getPropertyMaintenanceHistory } from '@/lib/maintenance/queries'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MaintenancePriorityBadge, MaintenanceStatusBadge } from '@/components/ui/badge'
import type { MaintenanceJob, MaintenancePriority, MaintenanceStatus } from '@/types'

async function getPropertyDetail(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('properties')
    .select('id, unit_number, property_type, bedrooms, bathrooms, status, building_id, building:buildings(id, name, suburb)')
    .eq('id', id)
    .maybeSingle()
  return data as unknown as {
    id: string
    unit_number: string
    property_type: string | null
    bedrooms: number
    bathrooms: number
    status: string
    building_id: string
    building: { id: string; name: string; suburb: string | null } | null
  } | null
}

function JobRow({ job }: { job: MaintenanceJob }) {
  return (
    <Link
      href={`/maintenance/${job.id}`}
      className="flex items-center gap-3 px-5 py-3 hover:bg-surface-muted transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate">{job.title}</p>
        <p className="text-xs text-ink-muted mt-0.5">
          {job.job_number && (
            <span className="mr-2 font-mono">{job.job_number}</span>
          )}
          {job.created_at && (
            <span>
              {new Date(job.created_at).toLocaleDateString('en-AU', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <MaintenancePriorityBadge priority={job.priority as MaintenancePriority} />
        <MaintenanceStatusBadge status={job.status as MaintenanceStatus} />
      </div>
    </Link>
  )
}

export default async function PropertyMaintenancePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [property, { open, history, error }] = await Promise.all([
    getPropertyDetail(id),
    getPropertyMaintenanceHistory(id),
  ])

  if (!property) notFound()

  const building = property.building

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Link
          href="/maintenance/properties"
          className="inline-flex items-center gap-1 text-[13px] text-ink-muted hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" /> Properties
        </Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="text-xl font-semibold text-ink">Unit {property.unit_number}</h1>
            {building && (
              <p className="text-[13px] text-ink-muted mt-0.5">
                {building.name}{building.suburb ? `, ${building.suburb}` : ''}
              </p>
            )}
          </div>
          <Link
            href={`/maintenance/new?building_id=${building?.id ?? ''}&property_id=${property.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> New Job
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              Open Jobs
            </CardTitle>
            <span className="text-sm text-ink-muted">{open.length}</span>
          </div>
        </CardHeader>
        {open.length === 0 ? (
          <CardContent>
            <p className="text-sm text-ink-muted text-center py-4">No open jobs for this property.</p>
          </CardContent>
        ) : (
          <div className="divide-y divide-line">
            {open.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-ink-muted" />
              History
            </CardTitle>
            <span className="text-sm text-ink-muted">{history.length}</span>
          </div>
        </CardHeader>
        {history.length === 0 ? (
          <CardContent>
            <p className="text-sm text-ink-muted text-center py-4">No completed jobs on record.</p>
          </CardContent>
        ) : (
          <div className="divide-y divide-line">
            {history.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
