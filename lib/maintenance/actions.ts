'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { MaintenanceStatus } from '@/types'

export interface ActionState {
  error: string | null
  ok?: boolean
}

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key)
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t === '' ? null : t
}

function num(formData: FormData, key: string): number | null {
  const v = str(formData, key)
  if (v === null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

async function currentContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, companyId: null as string | null }
  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).maybeSingle()
  return { supabase, user, companyId: (profile?.company_id as string | null) ?? null }
}

export async function createMaintenanceJob(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user, companyId } = await currentContext()
  if (!user || !companyId) {
    return { error: 'You must be signed in to a company workspace to create a job.' }
  }

  const title = str(formData, 'title')
  if (!title) return { error: 'A job title is required.' }

  const assignedStaffId = str(formData, 'assigned_staff_id')
  const scheduledDate = str(formData, 'scheduled_date')
  let status: MaintenanceStatus = 'new'
  if (assignedStaffId && scheduledDate) status = 'scheduled'
  else if (assignedStaffId) status = 'assigned'

  const payload = {
    company_id: companyId,
    title,
    description: str(formData, 'description'),
    building_id: str(formData, 'building_id'),
    property_id: str(formData, 'property_id'),
    tenant_id: str(formData, 'tenant_id'),
    category_id: str(formData, 'category_id'),
    priority: (str(formData, 'priority') ?? 'medium') as string,
    status,
    source: (str(formData, 'source') ?? 'manager') as string,
    assigned_staff_id: assignedStaffId,
    reported_by_name: str(formData, 'reported_by_name'),
    due_date: str(formData, 'due_date'),
    scheduled_date: scheduledDate,
    preferred_access_window: str(formData, 'preferred_access_window'),
    access_notes: str(formData, 'access_notes'),
    internal_notes: str(formData, 'internal_notes'),
    estimated_cost: num(formData, 'estimated_cost'),
    created_by: user.id,
  }

  const { data, error } = await supabase
    .from('maintenance_jobs')
    .insert(payload)
    .select('id')
    .single()

  if (error) return { error: error.message }

  await supabase.from('audit_logs').insert({
    company_id: companyId,
    user_id: user.id,
    action: 'created',
    entity_type: 'maintenance_job',
    entity_id: data.id,
    description: `Created maintenance job: ${title}`,
  })

  revalidatePath('/maintenance')
  redirect(`/maintenance/${data.id}`)
}

export async function updateJobStatus(jobId: string, status: MaintenanceStatus, note: string): Promise<ActionState> {
  const { supabase, user, companyId } = await currentContext()
  if (!user) return { error: 'Not signed in.' }

  const { error } = await supabase
    .from('maintenance_jobs')
    .update({ status, updated_by: user.id })
    .eq('id', jobId)

  if (error) return { error: error.message }

  if (note?.trim()) {
    const { data: latest } = await supabase
      .from('maintenance_job_status_history')
      .select('id')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (latest?.id) {
      await supabase.from('maintenance_job_status_history').update({ note: note.trim() }).eq('id', latest.id)
    }
  }

  if (companyId) {
    await supabase.from('audit_logs').insert({
      company_id: companyId,
      user_id: user.id,
      action: 'status_changed',
      entity_type: 'maintenance_job',
      entity_id: jobId,
      description: `Status changed to ${status}`,
    })
  }

  revalidatePath(`/maintenance/${jobId}`)
  revalidatePath('/maintenance')
  return { error: null, ok: true }
}

export async function addJobComment(jobId: string, comment: string, isInternal: boolean): Promise<ActionState> {
  const { supabase, user } = await currentContext()
  if (!user) return { error: 'Not signed in.' }
  if (!comment.trim()) return { error: 'Comment cannot be empty.' }

  const { error } = await supabase.from('maintenance_job_comments').insert({
    job_id: jobId,
    comment: comment.trim(),
    is_internal: isInternal,
    author_id: user.id,
  })
  if (error) return { error: error.message }

  revalidatePath(`/maintenance/${jobId}`)
  return { error: null, ok: true }
}

export async function toggleChecklistItem(itemId: string, jobId: string, done: boolean): Promise<ActionState> {
  const { supabase, user } = await currentContext()
  if (!user) return { error: 'Not signed in.' }

  const { error } = await supabase
    .from('maintenance_job_checklist_items')
    .update({ is_done: done, done_by: done ? user.id : null, done_at: done ? new Date().toISOString() : null })
    .eq('id', itemId)
  if (error) return { error: error.message }

  revalidatePath(`/maintenance/${jobId}`)
  return { error: null, ok: true }
}

export async function assignJobStaff(
  jobId: string,
  staffId: string | null,
  scheduledDate: string | null,
  note: string,
): Promise<ActionState> {
  const { supabase, user, companyId } = await currentContext()
  if (!user) return { error: 'Not signed in.' }

  const { data: current } = await supabase
    .from('maintenance_jobs')
    .select('status')
    .eq('id', jobId)
    .maybeSingle()

  const update: Record<string, unknown> = {
    assigned_staff_id: staffId,
    scheduled_date: scheduledDate,
    updated_by: user.id,
  }

  if (staffId && current?.status && ['new', 'triage'].includes(current.status)) {
    update.status = scheduledDate ? 'scheduled' : 'assigned'
  } else if (!staffId && current?.status === 'assigned') {
    update.status = 'new'
  }

  const { error } = await supabase.from('maintenance_jobs').update(update).eq('id', jobId)
  if (error) return { error: error.message }

  if (companyId) {
    await supabase.from('audit_logs').insert({
      company_id: companyId,
      user_id: user.id,
      action: 'updated',
      entity_type: 'maintenance_job',
      entity_id: jobId,
      description: staffId
        ? `Assigned job${scheduledDate ? `, scheduled ${scheduledDate}` : ''}`
        : 'Unassigned job',
    })
  }

  revalidatePath('/maintenance/schedule')
  revalidatePath(`/maintenance/${jobId}`)
  revalidatePath('/maintenance')
  return { error: null, ok: true }
}

export async function completeJob(jobId: string, completionNotes: string): Promise<ActionState> {
  const { supabase, user, companyId } = await currentContext()
  if (!user) return { error: 'Not signed in.' }

  const { error } = await supabase
    .from('maintenance_jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completion_notes: completionNotes.trim() || null,
      updated_by: user.id,
    })
    .eq('id', jobId)

  if (error) return { error: error.message }

  if (companyId) {
    await supabase.from('audit_logs').insert({
      company_id: companyId,
      user_id: user.id,
      action: 'status_changed',
      entity_type: 'maintenance_job',
      entity_id: jobId,
      description: 'Marked as completed',
    })
  }

  revalidatePath(`/maintenance/${jobId}`)
  revalidatePath('/maintenance')
  revalidatePath('/maintenance/my-jobs')
  return { error: null, ok: true }
}
