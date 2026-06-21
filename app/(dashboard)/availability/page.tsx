export const dynamic = 'force-dynamic'

import { CalendarDays, Eye, ArrowRight } from 'lucide-react'
import { PropertyStatusBadge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import type { PropertyStatus } from '@/types'

interface AvailableProperty {
  id: string
  unit_number: string
  property_type: string | null
  bedrooms: number
  bathrooms: number
  rent_amount: number | null
  available_date: string | null
  status: PropertyStatus
  agent_visible: boolean
  building: { id: string; name: string; suburb: string | null } | null
}

async function getAvailableProperties(): Promise<{
  properties: AvailableProperty[]
  buildings: { id: string; name: string }[]
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const [propsRes, buildingsRes] = await Promise.all([
      supabase
        .from('properties')
        .select('id, unit_number, property_type, bedrooms, bathrooms, rent_amount, available_date, status, agent_visible, building:buildings(id, name, suburb)')
        .eq('is_active', true)
        .in('status', ['available', 'coming_soon'])
        .order('available_date', { ascending: true, nullsFirst: false }),
      supabase
        .from('buildings')
        .select('id, name')
        .eq('is_active', true)
        .order('name'),
    ])
    if (propsRes.error) return { properties: [], buildings: [], error: propsRes.error.message }
    return {
      properties: (propsRes.data as unknown as AvailableProperty[]) ?? [],
      buildings: (buildingsRes.data ?? []) as { id: string; name: string }[],
      error: null,
    }
  } catch (err) {
    return { properties: [], buildings: [], error: err instanceof Error ? err.message : 'Failed to load' }
  }
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AvailabilityPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

  const filterBuilding = first(sp.building) ?? ''
  const filterType = first(sp.type) ?? ''
  const filterStatus = first(sp.status) ?? ''

  const { properties: allProperties, buildings, error } = await getAvailableProperties()

  const properties = allProperties.filter((p) => {
    if (filterBuilding && p.building?.id !== filterBuilding) return false
    if (filterType && p.property_type !== filterType) return false
    if (filterStatus && p.status !== filterStatus) return false
    return true
  })

  const availableNow = properties.filter((p) => p.status === 'available').length
  const comingSoon = properties.filter((p) => p.status === 'coming_soon').length
  const agentVisible = properties.filter((p) => p.agent_visible).length

  const propertyTypes = [...new Set(allProperties.map((p) => p.property_type).filter(Boolean))] as string[]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Availability</h1>
          <p className="text-ink-muted text-sm mt-0.5">
            {availableNow} available now · {comingSoon} coming soon
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <Eye className="h-4 w-4 text-green-600" />
          <span>{agentVisible} agent-visible</span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</div>
      )}

      <form method="get" className="flex flex-wrap gap-3 p-4 bg-surface rounded-xl border border-line shadow-sm">
        <select
          name="building"
          defaultValue={filterBuilding}
          className="text-sm border border-line-strong rounded-lg px-3 py-2 bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Buildings</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select
          name="type"
          defaultValue={filterType}
          className="text-sm border border-line-strong rounded-lg px-3 py-2 bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Types</option>
          {propertyTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={filterStatus}
          className="text-sm border border-line-strong rounded-lg px-3 py-2 bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Statuses</option>
          <option value="available">Available Now</option>
          <option value="coming_soon">Coming Soon</option>
        </select>
        <button
          type="submit"
          className="text-sm px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
        >
          Filter
        </button>
        {(filterBuilding || filterType || filterStatus) && (
          <Link
            href="/availability"
            className="text-sm px-4 py-2 rounded-lg border border-line text-ink-muted hover:text-ink transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="h-8 w-8 text-ink-faint mx-auto mb-3" />
            <p className="text-sm text-ink-muted">No available properties match your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {properties.map((property) => (
            <div
              key={property.id}
              className="bg-surface rounded-xl border border-line shadow-sm hover:shadow-md hover:border-primary/30 transition-all overflow-hidden group"
            >
              <div
                className={`h-1.5 w-full ${property.status === 'available' ? 'bg-green-500' : 'bg-violet-400'}`}
              />
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-ink-muted font-medium">
                      {property.building?.name ?? 'Unknown Building'}
                    </p>
                    <h3 className="font-bold text-ink text-lg leading-tight">
                      Unit {property.unit_number}
                    </h3>
                    {property.building?.suburb && (
                      <p className="text-xs text-ink-subtle">{property.building.suburb}</p>
                    )}
                  </div>
                  <PropertyStatusBadge status={property.status} />
                </div>

                <div className="text-sm text-ink-muted">
                  {property.property_type ?? 'Property'} ·{' '}
                  {property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} bed`} ·{' '}
                  {property.bathrooms} bath
                </div>

                {property.available_date && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <CalendarDays className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-ink-muted">
                      Available{' '}
                      <strong>
                        {new Date(property.available_date).toLocaleDateString('en-AU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </strong>
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-line">
                  <div>
                    {property.rent_amount ? (
                      <>
                        <span className="text-lg font-bold text-ink">
                          {formatCurrency(property.rent_amount)}
                        </span>
                        <span className="text-xs text-ink-subtle">/wk</span>
                      </>
                    ) : (
                      <span className="text-sm text-ink-subtle">Price TBC</span>
                    )}
                  </div>
                  <Link
                    href={`/applications/new?property=${property.id}`}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 group-hover:underline"
                  >
                    Apply <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
