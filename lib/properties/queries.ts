import { createClient } from '@/lib/supabase/server'
import type { PropertyStatus } from '@/types'

export interface PropertyRow {
  id: string
  unit_number: string
  property_type: string | null
  bedrooms: number
  bathrooms: number
  rent_amount: number | null
  bond_amount: number | null
  status: PropertyStatus
  available_date: string | null
  agent_visible: boolean
  building_id: string
  building: { id: string; name: string; suburb: string | null } | null
  assigned_manager: { full_name: string | null } | null
  owner: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
    company_name: string | null
  } | null
  current_occupancy: {
    id: string
    lease_start: string
    lease_end: string | null
    rent_amount: number | null
    tenant: {
      id: string
      first_name: string
      last_name: string
      email: string | null
      phone: string | null
    } | null
  } | null
}

export interface PropertyFilters {
  q?: string
  buildingId?: string
  status?: string
  type?: string
  page?: number
  pageSize?: number
}

const PAGE_SIZE = 50

export async function getProperties(
  filters: PropertyFilters = {}
): Promise<{ properties: PropertyRow[]; total: number; error: string | null }> {
  try {
    const supabase = await createClient()
    const pageSize = filters.pageSize ?? PAGE_SIZE
    const page = Math.max(1, filters.page ?? 1)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('properties')
      .select(
        `
        id, unit_number, property_type, bedrooms, bathrooms,
        rent_amount, bond_amount, status, available_date, agent_visible,
        building_id,
        building:buildings(id, name, suburb),
        assigned_manager:profiles!assigned_manager_id(full_name),
        owner:owners!owner_id(id, first_name, last_name, email, phone, company_name)
      `,
        { count: 'exact' }
      )
      .eq('is_active', true)
      .order('unit_number')

    if (filters.buildingId) query = query.eq('building_id', filters.buildingId)
    if (filters.status) query = query.eq('status', filters.status as PropertyStatus)
    if (filters.type) query = query.eq('property_type', filters.type)
    if (filters.q) {
      const term = filters.q.replace(/[%,]/g, ' ').trim()
      if (term) query = query.ilike('unit_number', `%${term}%`)
    }

    const { data: properties, error, count } = await query.range(from, to)
    if (error) return { properties: [], total: 0, error: error.message }
    if (!properties?.length) return { properties: [], total: count ?? 0, error: null }

    // Fetch current occupancies for this page's properties only
    const { data: occupancies } = await supabase
      .from('occupancies')
      .select(`
        id, property_id, lease_start, lease_end, rent_amount,
        tenant:tenants(id, first_name, last_name, email, phone)
      `)
      .in('property_id', properties.map((p) => p.id))
      .eq('is_current', true)

    const occMap: Record<string, unknown> = {}
    for (const occ of occupancies ?? []) {
      occMap[occ.property_id as string] = occ
    }

    const items: PropertyRow[] = (properties as unknown as PropertyRow[]).map((p) => ({
      ...p,
      current_occupancy: (occMap[p.id] as PropertyRow['current_occupancy']) ?? null,
    }))

    return { properties: items, total: count ?? 0, error: null }
  } catch (err) {
    return {
      properties: [],
      total: 0,
      error: err instanceof Error ? err.message : 'Failed to load properties',
    }
  }
}
