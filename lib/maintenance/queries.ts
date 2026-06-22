import { createClient } from '@/lib/supabase/server'
import type {
  MaintenanceJob,
  MaintenanceFormOptions,
  MaintenanceJobFilters,
  MaintenanceComment,
  MaintenanceStatusHistory,
  MaintenanceChecklistItem,
  MaintenanceCost,
  MaintenanceStaffProfile,
  MaintenanceStatus,
  MaintenanceService,
  MaintenanceInvoice,
  MaintenanceTravelTime,
} from '@/types'
import { OPEN_STATUSES } from './constants'

const JOB_LIST_SELECT = `
  id, job_number, title, issue_type, status, priority, source,
  assigned_staff_id, assigned_manager_id,
  property_id, building_id, tenant_id, category_id,
  due_date, scheduled_date, created_at,
  building:buildings(id, name),
  property:properties(id, unit_number, owner:owners!owner_id(id, first_name, last_name, email, company_name)),
  tenant:tenants(id, first_name, last_name, email, phone),
  category:maintenance_categories(id, name, color),
  assigned_staff:maintenance_staff_profiles(id, full_name, color)
`

const JOB_DETAIL_SELECT = `
  *,
  building:buildings(id, name, address),
  property:properties(id, unit_number, property_type, owner:owners!owner_id(id, first_name, last_name, email, phone, company_name)),
  tenant:tenants(id, first_name, last_name, email, phone),
  category:maintenance_categories(id, name, color),
  assigned_staff:maintenance_staff_profiles(id, full_name, trade, phone, email, color)
`

export interface JobListResult {
  jobs: MaintenanceJob[]
  total: number
  error: string | null
}

const JOB_PAGE_SIZE = 50

export async function getMaintenanceJobs(filters: MaintenanceJobFilters = {}): Promise<JobListResult> {
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = filters.pageSize ?? JOB_PAGE_SIZE
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  try {
    const supabase = await createClient()
    let query = supabase
      .from('maintenance_jobs')
      .select(JOB_LIST_SELECT, { count: 'exact' })
      .eq('is_active', true)

    const view = filters.tab ?? 'open'
    if (view === 'open') query = query.in('status', OPEN_STATUSES)
    else if (view === 'completed') query = query.in('status', ['completed', 'closed'])
    else if (view === 'unassigned') query = query.is('assigned_staff_id', null).in('status', OPEN_STATUSES)

    if (filters.status) query = query.eq('status', filters.status)
    if (filters.priority) query = query.eq('priority', filters.priority)
    if (filters.building) query = query.eq('building_id', filters.building)
    if (filters.category) query = query.eq('category_id', filters.category)
    if (filters.staff === 'unassigned') query = query.is('assigned_staff_id', null)
    else if (filters.staff) query = query.eq('assigned_staff_id', filters.staff)

    if (filters.due === 'overdue') {
      query = query.in('status', OPEN_STATUSES).lt('due_date', new Date().toISOString().slice(0, 10))
    } else if (filters.due === 'today') {
      query = query.eq('due_date', new Date().toISOString().slice(0, 10))
    } else if (filters.due === 'week') {
      const wk = new Date(); wk.setDate(wk.getDate() + 7)
      query = query.lte('due_date', wk.toISOString().slice(0, 10))
    }

    if (filters.q) {
      const term = filters.q.replace(/[%,]/g, ' ').trim()
      if (term) query = query.or(`title.ilike.%${term}%,job_number.ilike.%${term}%`)
    }

    const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to)
    if (error) return { jobs: [], total: 0, error: error.message }
    return { jobs: (data as unknown as MaintenanceJob[]) ?? [], total: count ?? 0, error: null }
  } catch (err) {
    return { jobs: [], total: 0, error: err instanceof Error ? err.message : 'Failed to load maintenance jobs' }
  }
}

export interface JobDetailResult {
  job: MaintenanceJob | null
  comments: MaintenanceComment[]
  history: MaintenanceStatusHistory[]
  checklist: MaintenanceChecklistItem[]
  costs: MaintenanceCost[]
  error: string | null
}

export async function getMaintenanceJob(id: string): Promise<JobDetailResult> {
  const empty = { job: null, comments: [], history: [], checklist: [], costs: [] }
  try {
    const supabase = await createClient()
    const { data: job, error } = await supabase
      .from('maintenance_jobs')
      .select(JOB_DETAIL_SELECT)
      .eq('id', id)
      .maybeSingle()

    if (error) return { ...empty, error: error.message }
    if (!job) return { ...empty, error: null }

    const [comments, history, checklist, costs] = await Promise.all([
      supabase.from('maintenance_job_comments').select('*').eq('job_id', id).order('created_at', { ascending: true }),
      supabase.from('maintenance_job_status_history').select('*').eq('job_id', id).order('created_at', { ascending: false }),
      supabase.from('maintenance_job_checklist_items').select('*').eq('job_id', id).order('sort_order', { ascending: true }),
      supabase.from('maintenance_job_costs').select('*').eq('job_id', id).order('created_at', { ascending: true }),
    ])

    return {
      job: job as unknown as MaintenanceJob,
      comments: (comments.data as unknown as MaintenanceComment[]) ?? [],
      history: (history.data as unknown as MaintenanceStatusHistory[]) ?? [],
      checklist: (checklist.data as unknown as MaintenanceChecklistItem[]) ?? [],
      costs: (costs.data as unknown as MaintenanceCost[]) ?? [],
      error: null,
    }
  } catch (err) {
    return { ...empty, error: err instanceof Error ? err.message : 'Failed to load job' }
  }
}

export interface MaintenanceStats {
  open: number
  urgent: number
  overdue: number
  dueThisWeek: number
  unassigned: number
}

export async function getMaintenanceStats(): Promise<MaintenanceStats> {
  const zero: MaintenanceStats = { open: 0, urgent: 0, overdue: 0, dueThisWeek: 0, unassigned: 0 }
  try {
    const supabase = await createClient()
    const today = new Date().toISOString().slice(0, 10)
    const week = new Date(); week.setDate(week.getDate() + 7)
    const weekStr = week.toISOString().slice(0, 10)
    const base = () =>
      supabase.from('maintenance_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .in('status', OPEN_STATUSES)

    const [open, urgent, overdue, dueWeek, unassigned] = await Promise.all([
      base(),
      base().eq('priority', 'urgent'),
      base().lt('due_date', today),
      base().gte('due_date', today).lte('due_date', weekStr),
      base().is('assigned_staff_id', null),
    ])

    return {
      open: open.count ?? 0,
      urgent: urgent.count ?? 0,
      overdue: overdue.count ?? 0,
      dueThisWeek: dueWeek.count ?? 0,
      unassigned: unassigned.count ?? 0,
    }
  } catch {
    return zero
  }
}

export async function getMaintenanceFormOptions(): Promise<MaintenanceFormOptions & { error: string | null }> {
  const empty: MaintenanceFormOptions = { buildings: [], properties: [], tenants: [], categories: [], staff: [] }
  try {
    const supabase = await createClient()
    const [buildings, properties, tenants, categories, staff] = await Promise.all([
      supabase.from('buildings').select('id, name').eq('is_active', true).eq('manages_maintenance', true).order('name'),
      supabase.from('properties').select('id, unit_number, building_id').eq('is_active', true).order('unit_number'),
      supabase.from('tenants').select('id, first_name, last_name').eq('is_active', true).order('last_name'),
      supabase.from('maintenance_categories').select('id, name, default_priority').eq('is_active', true).order('sort_order'),
      supabase.from('maintenance_staff_profiles').select('id, full_name, trade').eq('is_active', true).order('full_name'),
    ])
    return {
      buildings: (buildings.data as MaintenanceFormOptions['buildings']) ?? [],
      properties: (properties.data as MaintenanceFormOptions['properties']) ?? [],
      tenants: (tenants.data as MaintenanceFormOptions['tenants']) ?? [],
      categories: (categories.data as MaintenanceFormOptions['categories']) ?? [],
      staff: (staff.data as MaintenanceFormOptions['staff']) ?? [],
      error: buildings.error?.message ?? null,
    }
  } catch (err) {
    return { ...empty, error: err instanceof Error ? err.message : 'Failed to load options' }
  }
}

// ── Phase 2 ───────────────────────────────────────────────────────────────────────────────

export interface ScheduleStaff {
  id: string
  full_name: string
  color: string | null
  trade: string | null
}

export interface ScheduleJobsResult {
  byStaff: { staff: ScheduleStaff; jobs: MaintenanceJob[] }[]
  unscheduled: MaintenanceJob[]
  staff: ScheduleStaff[]
  error: string | null
}

export async function getScheduleJobs(weekStart: string): Promise<ScheduleJobsResult> {
  const empty: ScheduleJobsResult = { byStaff: [], unscheduled: [], staff: [], error: null }
  try {
    const supabase = await createClient()
    const end = new Date(weekStart + 'T00:00:00')
    end.setDate(end.getDate() + 6)
    const endStr = end.toISOString().slice(0, 10)

    const [scheduled, unscheduled, staffRes] = await Promise.all([
      supabase
        .from('maintenance_jobs')
        .select(JOB_LIST_SELECT)
        .eq('is_active', true)
        .in('status', OPEN_STATUSES)
        .not('assigned_staff_id', 'is', null)
        .gte('scheduled_date', weekStart)
        .lte('scheduled_date', endStr),
      supabase
        .from('maintenance_jobs')
        .select(JOB_LIST_SELECT)
        .eq('is_active', true)
        .in('status', OPEN_STATUSES)
        .is('scheduled_date', null)
        .order('priority')
        .limit(50),
      supabase
        .from('maintenance_staff_profiles')
        .select('id, full_name, color, trade')
        .eq('is_active', true)
        .order('full_name'),
    ])

    if (scheduled.error) return { ...empty, error: scheduled.error.message }
    const jobs = (scheduled.data as unknown as MaintenanceJob[]) ?? []
    const staffList = (staffRes.data ?? []) as ScheduleStaff[]

    return {
      byStaff: staffList.map(s => ({ staff: s, jobs: jobs.filter(j => j.assigned_staff_id === s.id) })),
      unscheduled: (unscheduled.data as unknown as MaintenanceJob[]) ?? [],
      staff: staffList,
      error: null,
    }
  } catch (err) {
    return { ...empty, error: err instanceof Error ? err.message : 'Failed to load schedule' }
  }
}

export interface MyJobsResult {
  overdue: MaintenanceJob[]
  today: MaintenanceJob[]
  upcoming: MaintenanceJob[]
  staffProfile: Pick<MaintenanceStaffProfile, 'id' | 'full_name' | 'trade'> | null
  error: string | null
}

export async function getMyJobs(staffId: string): Promise<MyJobsResult> {
  const empty: MyJobsResult = { overdue: [], today: [], upcoming: [], staffProfile: null, error: null }
  try {
    const supabase = await createClient()
    const todayStr = new Date().toISOString().slice(0, 10)

    const [profileRes, jobsRes] = await Promise.all([
      supabase
        .from('maintenance_staff_profiles')
        .select('id, full_name, trade')
        .eq('id', staffId)
        .maybeSingle(),
      supabase
        .from('maintenance_jobs')
        .select(JOB_LIST_SELECT)
        .eq('is_active', true)
        .eq('assigned_staff_id', staffId)
        .in('status', OPEN_STATUSES)
        .order('scheduled_date', { ascending: true, nullsFirst: false }),
    ])

    if (jobsRes.error) return { ...empty, error: jobsRes.error.message }
    const jobs = (jobsRes.data as unknown as MaintenanceJob[]) ?? []

    return {
      overdue: jobs.filter(j => j.scheduled_date && j.scheduled_date < todayStr),
      today: jobs.filter(j => j.scheduled_date === todayStr),
      upcoming: jobs.filter(j => !j.scheduled_date || j.scheduled_date > todayStr),
      staffProfile: profileRes.data as Pick<MaintenanceStaffProfile, 'id' | 'full_name' | 'trade'> | null,
      error: null,
    }
  } catch (err) {
    return { ...empty, error: err instanceof Error ? err.message : 'Failed to load my jobs' }
  }
}

export async function getStaffList(): Promise<ScheduleStaff[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('maintenance_staff_profiles')
      .select('id, full_name, color, trade')
      .eq('is_active', true)
      .order('full_name')
    return (data ?? []) as ScheduleStaff[]
  } catch {
    return []
  }
}

export interface PropertyMaintenanceResult {
  open: MaintenanceJob[]
  history: MaintenanceJob[]
  error: string | null
}

export async function getPropertyMaintenanceHistory(propertyId: string): Promise<PropertyMaintenanceResult> {
  const empty: PropertyMaintenanceResult = { open: [], history: [], error: null }
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('maintenance_jobs')
      .select(`
        *,
        building:buildings(id, name),
        property:properties(id, unit_number),
        category:maintenance_categories(id, name, color),
        assigned_staff:maintenance_staff_profiles(id, full_name, color)
      `)
      .eq('property_id', propertyId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) return { ...empty, error: error.message }
    const jobs = (data as unknown as MaintenanceJob[]) ?? []
    return {
      open: jobs.filter(j => OPEN_STATUSES.includes(j.status)),
      history: jobs.filter(j => !OPEN_STATUSES.includes(j.status)),
      error: null,
    }
  } catch (err) {
    return { ...empty, error: err instanceof Error ? err.message : 'Failed to load property maintenance' }
  }
}

// ── Phase 3 ───────────────────────────────────────────────────────────────────────────────

export interface ContractorRow {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  trade: string | null
  is_internal: boolean
  color: string | null
  is_active: boolean
  home_base_building_id: string | null
  hourly_rate: number | null
  callout_fee: number | null
  open_jobs: number
}

export async function getContractors(): Promise<{ contractors: ContractorRow[]; error: string | null }> {
  try {
    const supabase = await createClient()
    const [staffRes, jobCountRes] = await Promise.all([
      supabase
        .from('maintenance_staff_profiles')
        .select('id, full_name, email, phone, trade, is_internal, color, is_active, home_base_building_id, hourly_rate, callout_fee')
        .order('is_internal', { ascending: false })
        .order('full_name'),
      supabase
        .from('maintenance_jobs')
        .select('assigned_staff_id')
        .eq('is_active', true)
        .in('status', OPEN_STATUSES)
        .not('assigned_staff_id', 'is', null),
    ])
    if (staffRes.error) return { contractors: [], error: staffRes.error.message }

    const countMap: Record<string, number> = {}
    for (const j of (jobCountRes.data ?? [])) {
      const sid = j.assigned_staff_id as string
      countMap[sid] = (countMap[sid] ?? 0) + 1
    }

    const contractors: ContractorRow[] = (staffRes.data ?? []).map(s => ({
      ...s,
      open_jobs: countMap[s.id] ?? 0,
    }))
    return { contractors, error: null }
  } catch (err) {
    return { contractors: [], error: err instanceof Error ? err.message : 'Failed to load contractors' }
  }
}

export interface RecurringRuleRow {
  id: string
  title: string
  description: string | null
  frequency: string
  next_due_date: string | null
  default_priority: string
  auto_create_job: boolean
  last_generated_at: string | null
  is_active: boolean
  created_at: string
  building: { id: string; name: string } | null
  property: { id: string; unit_number: string } | null
  default_staff: { id: string; full_name: string } | null
}

export async function getRecurringRules(): Promise<{ rules: RecurringRuleRow[]; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('recurring_maintenance_rules')
      .select(`
        id, title, description, frequency, next_due_date, default_priority,
        auto_create_job, last_generated_at, is_active, created_at,
        building:buildings(id, name),
        property:properties(id, unit_number),
        default_staff:maintenance_staff_profiles(id, full_name)
      `)
      .order('next_due_date', { ascending: true, nullsFirst: false })
    if (error) return { rules: [], error: error.message }
    return { rules: (data as unknown as RecurringRuleRow[]) ?? [], error: null }
  } catch (err) {
    return { rules: [], error: err instanceof Error ? err.message : 'Failed to load recurring rules' }
  }
}

export interface MaintenanceAnalytics {
  byStatus: { status: string; count: number }[]
  byPriority: { priority: string; count: number }[]
  byBuilding: { building: string; count: number }[]
  byCategory: { category: string; count: number }[]
  byStaff: { staff: string; open_jobs: number }[]
  completedThisMonth: number
  avgDaysToComplete: number | null
  error: string | null
}

// ── Phase 3 additions ────────────────────────────────────────────────────────────────────

export async function getServices(): Promise<{ services: MaintenanceService[]; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('maintenance_services')
      .select('*, category:maintenance_categories(id, name, color)')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
    if (error) return { services: [], error: error.message }
    return { services: (data as unknown as MaintenanceService[]) ?? [], error: null }
  } catch (err) {
    return { services: [], error: err instanceof Error ? err.message : 'Failed to load services' }
  }
}

export async function getInvoices(
  status?: string,
): Promise<{ invoices: MaintenanceInvoice[]; error: string | null }> {
  try {
    const supabase = await createClient()
    let q = supabase
      .from('maintenance_invoices')
      .select(`
        id, invoice_number, status, issued_date, due_date, paid_date,
        subtotal, tax_rate, myob_sync_status, created_at,
        property:properties(id, unit_number),
        owner:owners(id, first_name, last_name, company_name)
      `)
      .order('created_at', { ascending: false })
    if (status && status !== 'all') q = q.eq('status', status)
    const { data, error } = await q
    if (error) return { invoices: [], error: error.message }
    return { invoices: (data as unknown as MaintenanceInvoice[]) ?? [], error: null }
  } catch (err) {
    return { invoices: [], error: err instanceof Error ? err.message : 'Failed to load invoices' }
  }
}

export async function getInvoice(id: string): Promise<{ invoice: MaintenanceInvoice | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('maintenance_invoices')
      .select(`
        *,
        property:properties(id, unit_number),
        owner:owners(id, first_name, last_name, company_name, email, phone),
        items:maintenance_invoice_items(
          *,
          service:maintenance_services(id, name, unit),
          job:maintenance_jobs(id, job_number, title)
        )
      `)
      .eq('id', id)
      .maybeSingle()
    if (error) return { invoice: null, error: error.message }
    return { invoice: (data as unknown as MaintenanceInvoice) ?? null, error: null }
  } catch (err) {
    return { invoice: null, error: err instanceof Error ? err.message : 'Failed to load invoice' }
  }
}

export interface InvoiceFormOptions {
  properties: { id: string; unit_number: string; building_id: string | null }[]
  owners: { id: string; first_name: string | null; last_name: string | null; company_name: string | null }[]
  services: Pick<MaintenanceService, 'id' | 'name' | 'unit' | 'base_price'>[]
  jobs: { id: string; job_number: string | null; title: string }[]
}

export async function getInvoiceFormOptions(): Promise<InvoiceFormOptions & { error: string | null }> {
  const empty: InvoiceFormOptions = { properties: [], owners: [], services: [], jobs: [] }
  try {
    const supabase = await createClient()
    const [properties, owners, services, jobs] = await Promise.all([
      supabase.from('properties').select('id, unit_number, building_id').eq('is_active', true).order('unit_number'),
      supabase.from('owners').select('id, first_name, last_name, company_name').eq('is_active', true).order('last_name'),
      supabase.from('maintenance_services').select('id, name, unit, base_price').eq('is_active', true).order('name'),
      supabase
        .from('maintenance_jobs')
        .select('id, job_number, title')
        .in('status', ['completed', 'closed'])
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(200),
    ])
    return {
      properties: (properties.data ?? []) as InvoiceFormOptions['properties'],
      owners: (owners.data ?? []) as InvoiceFormOptions['owners'],
      services: (services.data ?? []) as InvoiceFormOptions['services'],
      jobs: (jobs.data ?? []) as InvoiceFormOptions['jobs'],
      error: null,
    }
  } catch (err) {
    return { ...empty, error: err instanceof Error ? err.message : 'Failed to load options' }
  }
}

export async function getTravelTimes(): Promise<{ times: MaintenanceTravelTime[]; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('maintenance_building_travel_times')
      .select('*, from_building:buildings!from_building_id(id, name), to_building:buildings!to_building_id(id, name)')
      .order('travel_minutes', { ascending: true })
    if (error) return { times: [], error: error.message }
    return { times: (data as unknown as MaintenanceTravelTime[]) ?? [], error: null }
  } catch (err) {
    return { times: [], error: err instanceof Error ? err.message : 'Failed to load travel times' }
  }
}

// Returns a map "fromId:toId" → minutes (defaults to 30 if not configured)
export async function getTravelMap(): Promise<Record<string, number>> {
  const { times } = await getTravelTimes()
  const map: Record<string, number> = {}
  for (const t of times) {
    map[`${t.from_building_id}:${t.to_building_id}`] = t.travel_minutes
    // assume symmetric unless explicitly overridden
    if (!map[`${t.to_building_id}:${t.from_building_id}`]) {
      map[`${t.to_building_id}:${t.from_building_id}`] = t.travel_minutes
    }
  }
  return map
}

export async function getMaintenanceAnalytics(): Promise<MaintenanceAnalytics> {
  const empty: MaintenanceAnalytics = {
    byStatus: [], byPriority: [], byBuilding: [], byCategory: [], byStaff: [],
    completedThisMonth: 0, avgDaysToComplete: null, error: null,
  }
  try {
    const supabase = await createClient()
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

    const [jobsRes, completedRes] = await Promise.all([
      supabase
        .from('maintenance_jobs')
        .select('status, priority, building:buildings(name), category:maintenance_categories(name), assigned_staff:maintenance_staff_profiles(full_name)')
        .eq('is_active', true)
        .limit(2000),
      supabase
        .from('maintenance_jobs')
        .select('completed_at, created_at')
        .eq('is_active', true)
        .eq('status', 'completed')
        .gte('completed_at', monthStart),
    ])

    if (jobsRes.error) return { ...empty, error: jobsRes.error.message }

    const statusMap: Record<string, number> = {}
    const priorityMap: Record<string, number> = {}
    const buildingMap: Record<string, number> = {}
    const categoryMap: Record<string, number> = {}
    const staffMap: Record<string, number> = {}

    for (const job of (jobsRes.data ?? [])) {
      const s = job.status as string
      const p = (job as any).priority as string
      statusMap[s] = (statusMap[s] ?? 0) + 1
      priorityMap[p] = (priorityMap[p] ?? 0) + 1
      const bn = (job.building as any)?.name ?? 'No building'
      buildingMap[bn] = (buildingMap[bn] ?? 0) + 1
      const cn = (job.category as any)?.name ?? 'Uncategorised'
      categoryMap[cn] = (categoryMap[cn] ?? 0) + 1
      if (OPEN_STATUSES.includes(s as MaintenanceStatus)) {
        const sn = (job.assigned_staff as any)?.full_name ?? 'Unassigned'
        staffMap[sn] = (staffMap[sn] ?? 0) + 1
      }
    }

    const completed = completedRes.data ?? []
    let avgDays: number | null = null
    if (completed.length > 0) {
      const total = completed.reduce((sum, j) => {
        if (!j.completed_at || !j.created_at) return sum
        return sum + (new Date(j.completed_at).getTime() - new Date(j.created_at).getTime()) / 86_400_000
      }, 0)
      avgDays = Math.round(total / completed.length)
    }

    const sort = (m: Record<string, number>) =>
      Object.entries(m).sort((a, b) => b[1] - a[1])

    return {
      byStatus: sort(statusMap).map(([status, count]) => ({ status, count })),
      byPriority: sort(priorityMap).map(([priority, count]) => ({ priority, count })),
      byBuilding: sort(buildingMap).map(([building, count]) => ({ building, count })),
      byCategory: sort(categoryMap).map(([category, count]) => ({ category, count })),
      byStaff: sort(staffMap).map(([staff, open_jobs]) => ({ staff, open_jobs })),
      completedThisMonth: completed.length,
      avgDaysToComplete: avgDays,
      error: null,
    }
  } catch (err) {
    return { ...empty, error: err instanceof Error ? err.message : 'Failed to load analytics' }
  }
}
