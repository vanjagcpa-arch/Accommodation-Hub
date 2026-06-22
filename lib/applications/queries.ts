import { createClient } from '@/lib/supabase/server'
import type { Application, ApplicationStatus } from '@/types'

const APP_LIST_SELECT = `
  id, applicant_first_name, applicant_last_name, applicant_email, applicant_phone,
  university, preferred_move_in, status, created_at, building_id, property_id, agent_id,
  building:buildings(id, name),
  property:properties(id, unit_number),
  agent:agents(id, first_name, last_name, agency_name)
`

const APP_DETAIL_SELECT = `
  *,
  building:buildings(id, name, address),
  property:properties(id, unit_number, property_type, bedrooms, bathrooms),
  agent:agents(id, first_name, last_name, agency_name, email, phone),
  assigned_manager:profiles(id, full_name, email)
`

export interface ApplicationFilters {
  q?: string
  status?: ApplicationStatus | 'all'
  building?: string
  agent?: string
  tab?: string
  page?: number
  pageSize?: number
}

export interface ApplicationListResult {
  applications: Application[]
  total: number
  error: string | null
}

const APP_PAGE_SIZE = 50

export async function getApplications(filters: ApplicationFilters = {}): Promise<ApplicationListResult> {
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = filters.pageSize ?? APP_PAGE_SIZE
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  try {
    const supabase = await createClient()
    let query = supabase.from('applications').select(APP_LIST_SELECT, { count: 'exact' })

    const tab = filters.tab ?? 'active'
    if (tab === 'active') {
      query = query.in('status', ['new', 'reviewing'])
    } else if (tab === 'approved') {
      query = query.in('status', ['approved', 'moved_in'])
    } else if (tab === 'closed') {
      query = query.in('status', ['rejected', 'withdrawn'])
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters.building) {
      query = query.eq('building_id', filters.building)
    }

    if (filters.agent) {
      query = query.eq('agent_id', filters.agent)
    }

    if (filters.q) {
      const term = filters.q.replace(/[%,]/g, ' ').trim()
      if (term) {
        query = query.or(
          `applicant_first_name.ilike.%${term}%,applicant_last_name.ilike.%${term}%,applicant_email.ilike.%${term}%`
        )
      }
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) return { applications: [], total: 0, error: error.message }
    return { applications: (data as unknown as Application[]) ?? [], total: count ?? 0, error: null }
  } catch (err) {
    return { applications: [], total: 0, error: err instanceof Error ? err.message : 'Failed to load applications' }
  }
}

export interface ApplicationDetailResult {
  application: Application | null
  error: string | null
}

export async function getApplication(id: string): Promise<ApplicationDetailResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('applications')
      .select(APP_DETAIL_SELECT)
      .eq('id', id)
      .maybeSingle()

    if (error) return { application: null, error: error.message }
    if (!data) return { application: null, error: 'Application not found' }

    return { application: data as unknown as Application, error: null }
  } catch (err) {
    return { application: null, error: err instanceof Error ? err.message : 'Failed to load application' }
  }
}

export async function getApplicationFormOptions() {
  try {
    const supabase = await createClient()

    const [buildingsRes, agentsRes, managersRes] = await Promise.all([
      supabase
        .from('buildings')
        .select('id, name')
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('agents')
        .select('id, first_name, last_name, agency_name')
        .eq('is_active', true)
        .order('last_name'),
      supabase
        .from('profiles')
        .select('id, full_name')
        .eq('is_active', true)
        .in('role', ['admin', 'internal_manager'])
        .order('full_name'),
    ])

    return {
      buildings: (buildingsRes.data ?? []) as { id: string; name: string }[],
      agents: (agentsRes.data ?? []) as { id: string; first_name: string; last_name: string; agency_name: string | null }[],
      managers: (managersRes.data ?? []) as { id: string; full_name: string | null }[],
      error: buildingsRes.error?.message ?? agentsRes.error?.message ?? managersRes.error?.message ?? null,
    }
  } catch (err) {
    return {
      buildings: [],
      agents: [],
      managers: [],
      error: err instanceof Error ? err.message : 'Failed to load form options',
    }
  }
}

export async function getPropertiesForBuilding(buildingId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('properties')
      .select('id, unit_number, bedrooms, bathrooms, rent_amount, status')
      .eq('building_id', buildingId)
      .eq('is_active', true)
      .order('unit_number')

    if (error) return { properties: [], error: error.message }
    return { properties: data ?? [], error: null }
  } catch (err) {
    return { properties: [], error: err instanceof Error ? err.message : 'Failed to load properties' }
  }
}
