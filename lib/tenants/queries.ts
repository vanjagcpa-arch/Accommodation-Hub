import { createClient } from '@/lib/supabase/server'
import type { Tenant, Occupancy, Application } from '@/types'

const TENANT_LIST_SELECT = `
  *,
  current_occupancy:occupancies!inner(
    id, lease_start, lease_end, rent_amount, is_current,
    property:properties(id, unit_number, building_id,
      building:buildings(id, name)
    )
  )
`

export interface TenantFilters {
  q?: string
  building?: string
  university?: string
  status?: 'active' | 'inactive' | 'all'
}

export interface TenantListItem extends Tenant {
  current_occupancy?: (Occupancy & {
    property?: { id: string; unit_number: string; building_id: string; building?: { id: string; name: string } | null } | null
  }) | null
}

export interface TenantListResult {
  tenants: TenantListItem[]
  error: string | null
}

export async function getTenants(filters: TenantFilters = {}): Promise<TenantListResult> {
  try {
    const supabase = await createClient()

    // Fetch active tenants with a separate occupancy fetch to avoid inner join dropping unmatched
    let baseQuery = supabase
      .from('tenants')
      .select('*')

    if (!filters.status || filters.status === 'active') {
      baseQuery = baseQuery.eq('is_active', true)
    } else if (filters.status === 'inactive') {
      baseQuery = baseQuery.eq('is_active', false)
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

    const { data: tenants, error } = await baseQuery
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true })
      .limit(500)

    if (error) return { tenants: [], error: error.message }
    if (!tenants?.length) return { tenants: [], error: null }

    const tenantIds = tenants.map((t) => t.id)

    // Fetch current occupancies separately (left join equivalent)
    const { data: occupancies } = await supabase
      .from('occupancies')
      .select(`
        id, tenant_id, lease_start, lease_end, rent_amount, is_current,
        property:properties(id, unit_number, building_id,
          building:buildings(id, name)
        )
      `)
      .in('tenant_id', tenantIds)
      .eq('is_current', true)

    // Build lookup map tenant_id -> occupancy
    const occMap: Record<string, typeof occupancies extends (infer T)[] | null ? T : never> = {}
    if (occupancies) {
      for (const occ of occupancies) {
        occMap[occ.tenant_id as string] = occ
      }
    }

    let items: TenantListItem[] = tenants.map((t) => ({
      ...(t as unknown as Tenant),
      current_occupancy: (occMap[t.id] as unknown as TenantListItem['current_occupancy']) ?? null,
    }))

    // Client-side building filter (after join)
    if (filters.building) {
      items = items.filter(
        (t) => t.current_occupancy?.property?.building_id === filters.building
      )
    }

    return { tenants: items, error: null }
  } catch (err) {
    return { tenants: [], error: err instanceof Error ? err.message : 'Failed to load tenants' }
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

    // Count open maintenance jobs at their current property
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
