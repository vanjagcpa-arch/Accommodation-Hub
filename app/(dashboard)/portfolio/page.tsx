export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import PortfolioClient from './_components/portfolio-client'

export interface SourceRef {
  source: string
  external_id: string | null
  sync_status: string
  last_synced_at: string | null
}

export interface PortfolioRow {
  id: string
  unit_number: string
  status: string
  managed_status: string
  owner_source: string | null
  tenant_source: string | null
  pm_source: string | null
  availability_source: string | null
  reapit_external_id: string | null
  listonce_external_id: string | null
  manual_override: boolean
  created_at: string
  updated_at: string
  building: {
    id: string
    name: string
    address: string
    suburb: string | null
  }
  owner: {
    id: string
    first_name: string
    last_name: string
    company_name: string | null
    email: string | null
  } | null
  assigned_manager: {
    id: string
    full_name: string | null
  } | null
  current_tenant: {
    id: string
    first_name: string
    last_name: string
  } | null
  source_refs: SourceRef[]
}

async function getPortfolioData(): Promise<{
  rows: PortfolioRow[]
  buildings: { id: string; name: string }[]
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const [propertiesRes, buildingsRes] = await Promise.all([
      supabase
        .from('properties')
        .select(`
          id, unit_number, status,
          managed_status, owner_source, tenant_source, pm_source, availability_source,
          reapit_external_id, listonce_external_id, manual_override,
          created_at, updated_at,
          building:buildings(id, name, address, suburb),
          owner:owners!owner_id(id, first_name, last_name, email, company_name),
          assigned_manager:profiles!assigned_manager_id(id, full_name)
        `)
        .eq('is_active', true)
        .order('unit_number'),
      supabase
        .from('buildings')
        .select('id, name')
        .eq('is_active', true)
        .order('name'),
    ])

    const buildings = (buildingsRes.data ?? []) as { id: string; name: string }[]

    if (propertiesRes.error) {
      return { rows: [], buildings, error: propertiesRes.error.message }
    }

    const properties = propertiesRes.data ?? []
    if (!properties.length) return { rows: [], buildings, error: null }

    const propertyIds = properties.map((p) => (p as unknown as { id: string }).id)

    const [occupanciesRes, sourceRefsRes] = await Promise.all([
      supabase
        .from('occupancies')
        .select('property_id, tenant:tenants(id, first_name, last_name)')
        .in('property_id', propertyIds)
        .eq('is_current', true),
      supabase
        .from('property_source_refs')
        .select('property_id, source, external_id, sync_status, last_synced_at')
        .in('property_id', propertyIds),
    ])

    // Build lookup: property_id → current tenant
    const tenantMap: Record<string, { id: string; first_name: string; last_name: string }> = {}
    for (const occ of occupanciesRes.data ?? []) {
      const o = occ as unknown as {
        property_id: string
        tenant: { id: string; first_name: string; last_name: string } | null
      }
      if (o.tenant) tenantMap[o.property_id] = o.tenant
    }

    // Build lookup: property_id → SourceRef[]
    const refsMap: Record<string, SourceRef[]> = {}
    for (const ref of sourceRefsRes.data ?? []) {
      const r = ref as unknown as {
        property_id: string
        source: string
        external_id: string | null
        sync_status: string
        last_synced_at: string | null
      }
      ;(refsMap[r.property_id] ??= []).push({
        source: r.source,
        external_id: r.external_id,
        sync_status: r.sync_status,
        last_synced_at: r.last_synced_at,
      })
    }

    const rows: PortfolioRow[] = (properties as unknown as Record<string, unknown>[]).map((p) => {
      const b = (Array.isArray(p.building) ? p.building[0] : p.building) as {
        id: string; name: string; address: string; suburb: string | null
      } | null
      const o = (Array.isArray(p.owner) ? p.owner[0] : p.owner) as {
        id: string; first_name: string; last_name: string; company_name: string | null; email: string | null
      } | null
      const m = (Array.isArray(p.assigned_manager) ? p.assigned_manager[0] : p.assigned_manager) as {
        id: string; full_name: string | null
      } | null

      return {
        id: p.id as string,
        unit_number: p.unit_number as string,
        status: p.status as string,
        managed_status: (p.managed_status as string | null) ?? 'managed',
        owner_source: (p.owner_source as string | null) ?? null,
        tenant_source: (p.tenant_source as string | null) ?? null,
        pm_source: (p.pm_source as string | null) ?? null,
        availability_source: (p.availability_source as string | null) ?? null,
        reapit_external_id: (p.reapit_external_id as string | null) ?? null,
        listonce_external_id: (p.listonce_external_id as string | null) ?? null,
        manual_override: (p.manual_override as boolean | null) ?? false,
        created_at: p.created_at as string,
        updated_at: p.updated_at as string,
        building: b ?? { id: '', name: 'Unknown', address: '', suburb: null },
        owner: o ?? null,
        assigned_manager: m ?? null,
        current_tenant: tenantMap[p.id as string] ?? null,
        source_refs: refsMap[p.id as string] ?? [],
      }
    })

    return { rows, buildings, error: null }
  } catch (err) {
    return {
      rows: [],
      buildings: [],
      error: err instanceof Error ? err.message : 'Failed to load portfolio data',
    }
  }
}

export default async function PortfolioPage() {
  const { rows, buildings, error } = await getPortfolioData()
  return <PortfolioClient rows={rows} buildings={buildings} error={error} />
}
