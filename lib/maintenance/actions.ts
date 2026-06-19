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

/** Resolve the signed-in user and their company, or an error. */
async function currentContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, companyId: null as string | null }
  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).maybeSingle()
  return { supabase, user, companyId: (profile?.company_id as string | null) ?? null }
}

/**
 * Create a maintenance job (used by the New Request form via useActionState).
 * Writes an audit log entry and redirects to the new job on success.
 */
export async function createMaintenanceJob(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user, companyId } = await currentContext()
  if (!user || !companyId) {
    return { error: 'You must be signed in to a company workspace to create a job.' }
  }

  const title = str(formData, 'title')
  if (!title) return { error: 'A job title is required.' }

  const assignedStaffId = str(formData, 'assigned_staff_id')
  const status: MaintenanceStatus = assignedStaffId ? 'assigned' : 'new'

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
    scheduled_date: str(formData, 'scheduled_date'),
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

/** Change a job's status (the trigger records the history row). */
export async function updateJobStatus(jobId: string, status: MaintenanceStatus, note: string): Promise<ActionState> {
  const { supabase, user, companyId } = await currentContext()
  if (!user) return { error: 'Not signed in.' }

  const { error } = await supabase
    .from('maintenance_jobs')
    .update({ status, updated_by: user.id })
    .eq('id', jobId)

  if (error) return { error: error.message }

  // Attach the operator note to the auto-generated history row, if provided.
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

/** Add a comment / activity note to a job. */
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

/** Tick / untick a checklist item. */
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
