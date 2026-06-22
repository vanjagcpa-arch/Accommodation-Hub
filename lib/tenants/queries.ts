import { createClient } from '@/lib/supabase/server'
import type { Tenant, Occupancy, Application } from '@/types'

const TENANT_LIST_COLS = `
  id, first_name, last_name, email, phone,
  university, course, is_active, created_at
`

export interface TenantFilters {
  q?: string
  building?: string
  university?: string
  status?: 'active' | 'inactive' | 'all'
  page?: number
  pageSize?: number
}

export interface TenantListItem extends Tenant {
  current_occupancy?: (Occupancy & {
    property?: { id: string; unit_number: string; building_id: string; building?: { id: string; name: string } | null } | null
  }) | null
}

export interface TenantListResult {
  tenants: TenantListItem[]
  total: number
  error: string | null
}

const TENANT_PAGE_SIZE = 50

export async function getTenants(filters: TenantFilters = {}): Promise<TenantListResult> {
  try {
    const supabase = await createClient()
    const pageSize = filters.pageSize ?? TENANT_PAGE_SIZE
    const page = Math.max(1, filters.page ?? 1)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Server-side building filter: resolve tenant IDs via occupancies
    let buildingTenantIds: string[] | null = null
    if (filters.building) {
      const { data: propsInBuilding } = await supabase
        .from('properties')
        .select('id')
        .eq('building_id', filters.building)
        .eq('is_active', true)

      const propIds = (propsInBuilding ?? []).map((p) => p.id as string)
      if (propIds.length === 0) return { tenants: [], total: 0, error: null }

      const { data: occData } = await supabase
        .from('occupancies')
        .select('tenant_id')
        .in('property_id', propIds)
        .eq('is_current', true)

      buildingTenantIds = [...new Set((occData ?? []).map((o) => o.tenant_id as string))]
      if (buildingTenantIds.length === 0) return { tenants: [], total: 0, error: null }
    }

    let baseQuery = supabase
      .from('tenants')
      .select(TENANT_LIST_COLS, { count: 'exact' })

    if (!filters.status || filters.status === 'active') {
      baseQuery = baseQuery.eq('is_active', true)
    } else if (filters.status === 'inactive') {
      baseQuery = baseQuery.eq('is_active', false)
    }

    if (buildingTenantIds !== null) {
      baseQuery = baseQuery.in('id', buildingTenantIds)
    }

    if (filters.q) {
      const term = filters.q.replace(/[%,]/g, ' ').trim()
      if (term) {
        baseQuery = baseQuery.or(
          `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`
        )
      }
    }

    if (filters.university) {
      baseQuery = baseQuery.ilike('university', `%${filters.university}%`)
    }

    const { data: tenants, error, count } = await baseQuery
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true })
      .range(from, to)

    if (error) return { tenants: [], total: 0, error: error.message }
    if (!tenants?.length) return { tenants: [], total: count ?? 0, error: null }

    // Fetch current occupancies for this page's tenants only
    const { data: occupancies } = await supabase
      .from('occupancies')
      .select(`
        id, tenant_id, lease_start, lease_end, rent_amount, is_current,
        property:properties(id, unit_number, building_id,
          building:buildings(id, name)
        )
      `)
      .in('tenant_id', tenants.map((t) => t.id))
      .eq('is_current', true)

    const occMap: Record<string, typeof occupancies extends (infer T)[] | null ? T : never> = {}
    if (occupancies) {
      for (const occ of occupancies) {
        occMap[occ.tenant_id as string] = occ
      }
    }

    const items: TenantListItem[] = tenants.map((t) => ({
      ...(t as unknown as Tenant),
      current_occupancy: (occMap[t.id] as unknown as TenantListItem['current_occupancy']) ?? null,
    }))

    return { tenants: items, total: count ?? 0, error: null }
  } catch (err) {
    return { tenants: [], total: 0, error: err instanceof Error ? err.message : 'Failed to load tenants' }
  }
}

export interface TenantDetail extends Tenant {
  occupancies: (Omit<Occupancy, 'property' | 'tenant'> & {
    property?: { id: string; unit_number: string; building?: { id: string; name: string } | null } | null
  })[]
  applications: Pick<Application, 'id' | 'status' | 'created_at' | 'preferred_move_in' | 'building_id' | 'property_id'>[]
  open_job_count: number
}

export interface TenantDetailResult {
  tenant: TenantDetail | null
  error: string | null
}

export async function getTenant(id: string): Promise<TenantDetailResult> {
  try {
    const supabase = await createClient()

    const [tenantRes, occupanciesRes, applicationsRes] = await Promise.all([
      supabase.from('tenants').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('occupancies')
        .select(`
          id, property_id, tenant_id, lease_start, lease_end,
          rent_amount, bond_amount, is_current, notes, created_at,
          property:properties(id, unit_number,
            building:buildings(id, name)
          )
        `)
        .eq('tenant_id', id)
        .order('lease_start', { ascending: false }),
      supabase
        .from('applications')
        .select('id, status, created_at, preferred_move_in, building_id, property_id')
        .eq('linked_tenant_id', id)
        .order('created_at', { ascending: false }),
    ])

    if (tenantRes.error) return { tenant: null, error: tenantRes.error.message }
    if (!tenantRes.data) return { tenant: null, error: 'Tenant not found' }

    let open_job_count = 0
    const currentOcc = (occupanciesRes.data ?? []).find((o) => o.is_current)
    if (currentOcc?.property_id) {
      const { count } = await supabase
        .from('maintenance_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('property_id', currentOcc.property_id)
        .not('status', 'in', '("completed","closed","cancelled","duplicate")')
      open_job_count = count ?? 0
    }

    const tenant: TenantDetail = {
      ...(tenantRes.data as unknown as Tenant),
      occupancies: (occupanciesRes.data ?? []) as unknown as TenantDetail['occupancies'],
      applications: (applicationsRes.data ?? []) as unknown as TenantDetail['applications'],
      open_job_count,
    }

    return { tenant, error: null }
  } catch (err) {
    return { tenant: null, error: err instanceof Error ? err.message : 'Failed to load tenant' }
  }
}
