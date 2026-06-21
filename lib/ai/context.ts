import type { createClient } from '@/lib/supabase/server'

type DbClient = Awaited<ReturnType<typeof createClient>>

const OPEN_STATUSES = [
  'new', 'triage', 'assigned', 'scheduled', 'in_progress',
  'waiting_tenant', 'waiting_access', 'waiting_parts', 'waiting_quote', 'waiting_approval',
]

export interface ContextResult {
  toolResults: { label: string; result: unknown }[]
  dataUsed: string[]
}

function countBy(items: Record<string, unknown>[], key: string): Record<string, number> {
  const acc: Record<string, number> = {}
  for (const item of items) {
    const v = String(item[key] ?? 'unknown')
    acc[v] = (acc[v] ?? 0) + 1
  }
  return acc
}

async function queryBuildings(supabase: DbClient) {
  const { data, error } = await supabase
    .from('buildings')
    .select('id, name, address, suburb, total_properties')
    .eq('is_active', true)
    .order('name')
    .limit(50)
  if (error) {
    console.error('[ai/context] buildings query failed:', error.message)
    return null
  }
  return data as Record<string, unknown>[]
}

async function queryProperties(supabase: DbClient) {
  const { data, error } = await supabase
    .from('properties')
    .select('id, unit_number, building_id, status, managed_status, available_date, rent_amount')
    .eq('is_active', true)
    .order('unit_number')
    .limit(200)
  if (error) {
    console.error('[ai/context] properties query failed:', error.message)
    return null
  }
  return data as Record<string, unknown>[]
}

async function queryOpenJobs(supabase: DbClient) {
  const { data, error } = await supabase
    .from('maintenance_jobs')
    .select('id, job_number, title, status, priority, property_id, building_id, due_date, assigned_to, created_at')
    .in('status', OPEN_STATUSES)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) {
    console.error('[ai/context] maintenance_jobs query failed:', error.message)
    return null
  }
  return data as Record<string, unknown>[]
}

async function queryPropertyDetails(supabase: DbClient, propertyId: string) {
  const [propRes, occRes, jobsRes, appsRes] = await Promise.all([
    supabase
      .from('properties')
      .select('id, unit_number, building_id, property_type, status, managed_status, bedrooms, bathrooms, floor_level, size_sqm, available_date, rent_amount, bond_amount, features, notes')
      .eq('id', propertyId)
      .maybeSingle(),
    supabase
      .from('occupancies')
      .select('id, lease_start, lease_end, rent_amount, is_current, tenants(first_name, last_name, email)')
      .eq('property_id', propertyId)
      .eq('is_current', true)
      .limit(5),
    supabase
      .from('maintenance_jobs')
      .select('id, job_number, title, status, priority, due_date, assigned_to')
      .eq('property_id', propertyId)
      .in('status', OPEN_STATUSES)
      .eq('is_active', true)
      .limit(20),
    supabase
      .from('applications')
      .select('id, applicant_first_name, applicant_last_name, status, preferred_move_in, created_at')
      .eq('property_id', propertyId)
      .in('status', ['new', 'reviewing'])
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  if (propRes.error) console.error('[ai/context] property query failed:', propRes.error.message)
  if (occRes.error) console.error('[ai/context] occupancy query failed:', occRes.error.message)
  if (jobsRes.error) console.error('[ai/context] property jobs query failed:', jobsRes.error.message)
  if (appsRes.error) console.error('[ai/context] property apps query failed:', appsRes.error.message)

  return {
    property: propRes.data,
    current_occupants: (occRes.data ?? []) as Record<string, unknown>[],
    open_maintenance_jobs: (jobsRes.data ?? []) as Record<string, unknown>[],
    pending_applications: (appsRes.data ?? []) as Record<string, unknown>[],
  }
}

export async function buildAssistantContext(
  supabase: DbClient,
  message: string,
  ctx: { page?: string; propertyId?: string }
): Promise<ContextResult> {
  const msg = message.toLowerCase()
  const toolResults: { label: string; result: unknown }[] = []
  const dataUsed: string[] = []

  // Property-specific context: fetch all relevant data for this property
  if (ctx.propertyId) {
    const details = await queryPropertyDetails(supabase, ctx.propertyId)
    toolResults.push({
      label: `Property: ${details.property ? (details.property as Record<string, unknown>).unit_number : ctx.propertyId}`,
      result: details,
    })
    if (details.property) dataUsed.push('Property record')
    if (details.current_occupants.length > 0) dataUsed.push('Current occupancy')
    if (details.open_maintenance_jobs.length > 0) dataUsed.push(`${details.open_maintenance_jobs.length} open maintenance job(s)`)
    if (details.pending_applications.length > 0) dataUsed.push(`${details.pending_applications.length} pending application(s)`)
    return { toolResults, dataUsed: [...new Set(dataUsed)] }
  }

  // Global queries — decide what to fetch based on message keywords
  const wantsMaintenance = /maintenance|repair|job|fix|block|trade/.test(msg)
  const wantsVacancies = /vacant|vacancy|availab|priorit/.test(msg)
  const wantsSummary = /today|attention|summary|overview|dashboard|portfolio|how many|total/.test(msg)
  const loadAll = wantsSummary || (!wantsMaintenance && !wantsVacancies)

  if (loadAll) {
    // Fetch full overview in parallel
    const [buildings, props, jobs] = await Promise.all([
      queryBuildings(supabase),
      queryProperties(supabase),
      queryOpenJobs(supabase),
    ])
    if (buildings) {
      toolResults.push({ label: 'Buildings', result: buildings })
      dataUsed.push(`${buildings.length} building(s)`)
    }
    if (props) {
      toolResults.push({
        label: 'Portfolio overview',
        result: {
          total: props.length,
          by_status: countBy(props, 'status'),
          by_managed_status: countBy(props, 'managed_status'),
        },
      })
      dataUsed.push(`${props.length} total properties`)
    }
    if (jobs) {
      toolResults.push({
        label: 'Maintenance summary',
        result: {
          total_open: jobs.length,
          urgent: jobs.filter(j => j.priority === 'urgent').length,
          unassigned: jobs.filter(j => !j.assigned_to).length,
          by_priority: countBy(jobs, 'priority'),
          urgent_jobs: jobs.filter(j => j.priority === 'urgent').slice(0, 10),
        },
      })
      dataUsed.push(`${jobs.length} open maintenance job(s)`)
    }
  } else {
    // Targeted queries only
    if (wantsMaintenance) {
      const jobs = await queryOpenJobs(supabase)
      if (jobs) {
        toolResults.push({
          label: 'Open maintenance jobs',
          result: {
            total_open: jobs.length,
            urgent: jobs.filter(j => j.priority === 'urgent').length,
            unassigned: jobs.filter(j => !j.assigned_to).length,
            by_priority: countBy(jobs, 'priority'),
            by_status: countBy(jobs, 'status'),
            jobs,
          },
        })
        dataUsed.push(`${jobs.length} open maintenance job(s)`)
      }
    }
    if (wantsVacancies) {
      const props = await queryProperties(supabase)
      if (props) {
        const vacant = props.filter(p =>
          ['available', 'coming_soon', 'on_hold', 'maintenance_hold'].includes(String(p.status ?? ''))
        )
        toolResults.push({
          label: 'Properties not fully occupied',
          result: {
            total: vacant.length,
            by_status: countBy(vacant, 'status'),
            properties: vacant,
          },
        })
        dataUsed.push(`${vacant.length} vacant/hold properties`)
      }
    }
  }

  return { toolResults, dataUsed: [...new Set(dataUsed)] }
}
