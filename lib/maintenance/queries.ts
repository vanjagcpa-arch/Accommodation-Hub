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
} from '@/types'
import { OPEN_STATUSES } from './constants'

const JOB_LIST_SELECT = `
  *,
  building:buildings(id, name),
  property:properties(id, unit_number),
  tenant:tenants(id, first_name, last_name),
  category:maintenance_categories(id, name, color),
  assigned_staff:maintenance_staff_profiles(id, full_name, color)
`

const JOB_DETAIL_SELECT = `
  *,
  building:buildings(id, name, address),
  property:properties(id, unit_number, property_type),
  tenant:tenants(id, first_name, last_name, email, phone),
  category:maintenance_categories(id, name, color),
  assigned_staff:maintenance_staff_profiles(id, full_name, trade, phone, email, color)
`

export interface JobListResult {
  jobs: MaintenanceJob[]
  error: string | null
}

export async function getMaintenanceJobs(filters: MaintenanceJobFilters = {}): Promise<JobListResult> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('maintenance_jobs')
      .select(JOB_LIST_SELECT)
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
      if (term) query = query.or(`title.ilike.%${term}%,job_number.ilike.%${term}%,description.ilike.%${term}%`)
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(200)
    if (error) return { jobs: [], error: error.message }
    return { jobs: (data as unknown as MaintenanceJob[]) ?? [], error: null }
  } catch (err) {
    return { jobs: [], error: err instanceof Error ? err.message : 'Failed to load maintenance jobs' }
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
      supabase.from('buildings').select('id, name').eq('is_active', true).order('name'),
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

// ── Phase 2 ────────────────────────────────────────────────────────────────

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
