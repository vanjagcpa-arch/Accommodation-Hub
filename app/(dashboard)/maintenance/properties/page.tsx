export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Building2, Wrench, ChevronRight, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { OPEN_STATUSES } from '@/lib/maintenance/constants'

interface PropertyItem {
  id: string
  unit_number: string
  status: string
  open_jobs: number
}

interface BuildingWithProps {
  id: string
  name: string
  suburb: string | null
  total_properties: number
  properties: PropertyItem[]
  open_jobs: number
}

async function getMaintenanceBuildings(): Promise<{ buildings: BuildingWithProps[]; error: string | null }> {
  try {
    const supabase = await createClient()

    const [buildingsRes, propertiesRes, jobsRes] = await Promise.all([
      supabase
        .from('buildings')
        .select('id, name, suburb, total_properties')
        .eq('is_active', true)
        .eq('manages_maintenance', true)
        .order('name'),
      supabase
        .from('properties')
        .select('id, unit_number, building_id, status')
        .eq('is_active', true)
        .order('unit_number'),
      supabase
        .from('maintenance_jobs')
        .select('property_id')
        .eq('is_active', true)
        .in('status', OPEN_STATUSES)
        .not('property_id', 'is', null),
    ])

    if (buildingsRes.error) return { buildings: [], error: buildingsRes.error.message }

    const jobMap: Record<string, number> = {}
    for (const j of jobsRes.data ?? []) {
      const pid = j.property_id as string
      jobMap[pid] = (jobMap[pid] ?? 0) + 1
    }

    const bids = new Set((buildingsRes.data ?? []).map((b) => b.id))
    const allProps = (propertiesRes.data ?? []).filter((p) => bids.has(p.building_id))

    const propsByBuilding: Record<string, typeof allProps> = {}
    for (const p of allProps) {
      if (!propsByBuilding[p.building_id]) propsByBuilding[p.building_id] = []
      propsByBuilding[p.building_id].push(p)
    }

    const buildings: BuildingWithProps[] = (buildingsRes.data ?? []).map((b) => {
      const bprops = propsByBuilding[b.id] ?? []
      return {
        id: b.id,
        name: b.name,
        suburb: b.suburb,
        total_properties: b.total_properties,
        properties: bprops.map((p) => ({
          id: p.id,
          unit_number: p.unit_number,
          status: p.status,
          open_jobs: jobMap[p.id] ?? 0,
        })),
        open_jobs: bprops.reduce((sum, p) => sum + (jobMap[p.id] ?? 0), 0),
      }
    })

    return { buildings, error: null }
  } catch (err) {
    return { buildings: [], error: err instanceof Error ? err.message : 'Failed to load buildings' }
  }
}

export default async function MaintenancePropertiesPage() {
  const { buildings, error } = await getMaintenanceBuildings()
  const totalOpenJobs = buildings.reduce((sum, b) => sum + b.open_jobs, 0)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Properties</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            {buildings.length} {buildings.length === 1 ? 'building' : 'buildings'} · {totalOpenJobs} open {totalOpenJobs === 1 ? 'job' : 'jobs'}
          </p>
        </div>
        <Link
          href="/maintenance/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Job
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</div>
      )}

      {buildings.length === 0 && !error && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-8 w-8 text-ink-faint mx-auto mb-3" />
            <p className="text-sm text-ink-muted">No buildings with maintenance enabled.</p>
            <p className="text-xs text-ink-faint mt-1">Enable maintenance on buildings in Portfolio → Buildings.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {buildings.map((building) => (
          <Card key={building.id}>
            <div className="px-5 py-4 border-b border-line flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary-soft flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-ink">{building.name}</h2>
                  {building.suburb && (
                    <p className="text-xs text-ink-muted">{building.suburb}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {building.open_jobs > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    <Wrench className="h-3 w-3" />
                    {building.open_jobs} open
                  </span>
                )}
                <span className="text-xs text-ink-muted">
                  {building.properties.length} {building.properties.length === 1 ? 'property' : 'properties'}
                </span>
              </div>
            </div>

            <div className="divide-y divide-line">
              {building.properties.length === 0 ? (
                <p className="px-5 py-3 text-sm text-ink-muted">No properties in this building.</p>
              ) : (
                building.properties.map((prop) => (
                  <Link
                    key={prop.id}
                    href={`/maintenance/properties/${prop.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-surface-muted transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-ink">Unit {prop.unit_number}</span>
                      {prop.open_jobs > 0 && (
                        <Badge variant="warning">{prop.open_jobs} open</Badge>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-ink-faint group-hover:text-ink transition-colors" />
                  </Link>
                ))
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
