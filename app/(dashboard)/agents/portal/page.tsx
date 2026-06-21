export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { CalendarDays, Building2, ArrowRight, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge, PropertyStatusBadge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import type { PropertyStatus } from '@/types'

interface PortalProperty {
  id: string
  unit_number: string
  property_type: string | null
  bedrooms: number
  bathrooms: number
  rent_amount: number | null
  available_date: string | null
  status: PropertyStatus
  building: { id: string; name: string; suburb: string | null } | null
}

interface AgentRow {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  agency_name: string | null
  agent_type: string
  is_active: boolean
  building_count: number
}

async function getPortalData(): Promise<{
  properties: PortalProperty[]
  agents: AgentRow[]
  error: string | null
}> {
  const empty = { properties: [], agents: [], error: null }
  try {
    const supabase = await createClient()

    const [propertiesRes, agentsRes, buildingPermRes] = await Promise.all([
      supabase
        .from('properties')
        .select('id, unit_number, property_type, bedrooms, bathrooms, rent_amount, available_date, status, building_id, building:buildings(id, name, suburb)')
        .eq('is_active', true)
        .eq('agent_visible', true)
        .in('status', ['available', 'coming_soon'])
        .order('available_date', { ascending: true, nullsFirst: false }),
      supabase
        .from('agents')
        .select('id, first_name, last_name, email, agency_name, agent_type, is_active')
        .eq('is_active', true)
        .order('last_name'),
      supabase
        .from('agent_building_permissions')
        .select('agent_id, building_id')
        .eq('can_view_availability', true),
    ])

    const buildingCountMap: Record<string, number> = {}
    for (const perm of buildingPermRes.data ?? []) {
      const aid = perm.agent_id as string
      buildingCountMap[aid] = (buildingCountMap[aid] ?? 0) + 1
    }

    const agents: AgentRow[] = (agentsRes.data ?? []).map((a) => ({
      id: a.id,
      first_name: a.first_name,
      last_name: a.last_name,
      email: a.email,
      agency_name: a.agency_name,
      agent_type: a.agent_type,
      is_active: a.is_active,
      building_count: buildingCountMap[a.id] ?? 0,
    }))

    const properties: PortalProperty[] = (propertiesRes.data as unknown as PortalProperty[]) ?? []

    return { properties, agents, error: null }
  } catch (err) {
    return { ...empty, error: err instanceof Error ? err.message : 'Failed to load portal data' }
  }
}

const TYPE_VARIANT: Record<string, 'success' | 'info' | 'purple' | 'gray'> = {
  internal: 'success',
  external: 'info',
  referral: 'purple',
}

const TYPE_LABEL: Record<string, string> = {
  internal: 'Internal',
  external: 'External',
  referral: 'Referral',
}

export default async function AgentPortalPage() {
  const { properties, agents, error } = await getPortalData()
  const availableNow = properties.filter((p) => p.status === 'available')
  const comingSoon = properties.filter((p) => p.status === 'coming_soon')
  const referralAgents = agents.filter((a) => a.agent_type === 'referral')

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary-soft flex items-center justify-center">
          <Globe className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink">Agent Portal</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            {availableNow.length} available now · {comingSoon.length} coming soon · {referralAgents.length} referral agents
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</div>
      )}

      <div>
        <h2 className="text-[15px] font-semibold text-ink mb-3">Available for Leasing</h2>
        {properties.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Building2 className="h-8 w-8 text-ink-faint mx-auto mb-3" />
              <p className="text-sm text-ink-muted">No agent-visible properties available right now.</p>
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
                        {property.building?.name ?? 'Unknown building'}
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
                          <span className="text-lg font-bold text-ink">{formatCurrency(property.rent_amount)}</span>
                          <span className="text-xs text-ink-subtle">/wk</span>
                        </>
                      ) : (
                        <span className="text-sm text-ink-subtle">Price on request</span>
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

      <Card>
        <CardHeader>
          <CardTitle>Referral Agents</CardTitle>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-4">No agents on record.</p>
          ) : (
            <div className="divide-y divide-line">
              {agents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary-soft flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                      {[agent.first_name?.[0], agent.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {[agent.first_name, agent.last_name].filter(Boolean).join(' ') || 'Unknown'}
                      </p>
                      {agent.agency_name && (
                        <p className="text-xs text-ink-muted">{agent.agency_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {agent.building_count > 0 && (
                      <span className="text-xs text-ink-muted">
                        {agent.building_count} {agent.building_count === 1 ? 'building' : 'buildings'}
                      </span>
                    )}
                    <Badge variant={TYPE_VARIANT[agent.agent_type] ?? 'gray'}>
                      {TYPE_LABEL[agent.agent_type] ?? agent.agent_type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
