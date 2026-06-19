'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ApplicationStatus } from '@/types'

export interface ActionState {
  error: string | null
  ok?: boolean
  tenantId?: string
}

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key)
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t === '' ? null : t
}

async function currentContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, companyId: null as string | null }
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .maybeSingle()
  return { supabase, user, companyId: (profile?.company_id as string | null) ?? null }
}

export async function createApplication(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user, companyId } = await currentContext()
  if (!user || !companyId) {
    return { error: 'You must be signed in to a company workspace.' }
  }

  const firstName = str(formData, 'applicant_first_name')
  const lastName = str(formData, 'applicant_last_name')
  const email = str(formData, 'applicant_email')
  if (!firstName) return { error: 'First name is required.' }
  if (!lastName) return { error: 'Last name is required.' }
  if (!email) return { error: 'Applicant email is required.' }

  const propertyId = str(formData, 'property_id')
  const buildingId = str(formData, 'building_id')

  // Duplicate check: same email + same property within 90 days
  if (propertyId) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 90)
    const { data: dupProperty } = await supabase
      .from('applications')
      .select('id, status, created_at')
      .eq('company_id', companyId)
      .eq('applicant_email', email)
      .eq('property_id', propertyId)
      .not('status', 'in', '("rejected","withdrawn")')
      .gte('created_at', cutoff.toISOString())
      .maybeSingle()

    if (dupProperty) {
      return {
        error: `An active application from ${email} for this property already exists (status: ${dupProperty.status}). To avoid duplicates, update the existing application instead.`,
      }
    }
  } else if (buildingId) {
    // Looser check: same email + same building within 30 days
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    const { data: dupBuilding } = await supabase
      .from('applications')
      .select('id, status, created_at')
      .eq('company_id', companyId)
      .eq('applicant_email', email)
      .eq('building_id', buildingId)
      .not('status', 'in', '("rejected","withdrawn")')
      .gte('created_at', cutoff.toISOString())
      .maybeSingle()

    if (dupBuilding) {
      return {
        error: `An application from ${email} for this building already exists within the last 30 days (status: ${dupBuilding.status}). Update the existing application instead.`,
      }
    }
  }

  const electricityConsentGiven =
    str(formData, 'electricity_consent_given') === 'true' ||
    formData.get('electricity_consent_given') === 'on'

  const payload = {
    company_id: companyId,
    building_id: buildingId,
    property_id: propertyId,
    applicant_first_name: firstName,
    applicant_last_name: lastName,
    applicant_email: email,
    applicant_phone: str(formData, 'applicant_phone'),
    preferred_move_in: str(formData, 'preferred_move_in'),
    student_status: str(formData, 'student_status'),
    university: str(formData, 'university'),
    course: str(formData, 'course'),
    status: 'new' as ApplicationStatus,
    agent_id: str(formData, 'agent_id'),
    assigned_manager_id: str(formData, 'assigned_manager_id'),
    internal_notes: str(formData, 'internal_notes'),
    electricity_setup_required: str(formData, 'electricity_setup_required') === 'true' ||
      formData.get('electricity_setup_required') === 'on',
    electricity_consent_given: electricityConsentGiven,
    electricity_consent_timestamp: electricityConsentGiven ? new Date().toISOString() : null,
    electricity_consent_version: electricityConsentGiven ? '1.0' : null,
    created_by: user.id,
  }

  const { data, error } = await supabase
    .from('applications')
    .insert(payload)
    .select('id')
    .single()

  if (error) return { error: error.message }

  await supabase.from('audit_logs').insert({
    company_id: companyId,
    user_id: user.id,
    action: 'created',
    entity_type: 'application',
    entity_id: data.id,
    new_values: payload,
    description: `New application from ${firstName} ${lastName} (${email})`,
  })

  revalidatePath('/applications')
  return { error: null, ok: true }
}

export async function updateApplicationStatus(
  id: string,
  newStatus: ApplicationStatus,
  options: { rejectionReason?: string; notes?: string } = {}
): Promise<ActionState> {
  const { supabase, user, companyId } = await currentContext()
  if (!user || !companyId) return { error: 'Not authenticated.' }

  const { data: current } = await supabase
    .from('applications')
    .select('status, applicant_first_name, applicant_last_name')
    .eq('id', id)
    .maybeSingle()

  if (!current) return { error: 'Application not found.' }

  const updates: Record<string, unknown> = {
    status: newStatus,
    updated_by: user.id,
  }
  if (options.rejectionReason) updates.rejection_reason = options.rejectionReason
  if (options.notes) updates.internal_notes = options.notes

  const { error } = await supabase
    .from('applications')
    .update(updates)
    .eq('id', id)
    .eq('company_id', companyId)

  if (error) return { error: error.message }

  await supabase.from('audit_logs').insert({
    company_id: companyId,
    user_id: user.id,
    action: 'status_changed',
    entity_type: 'application',
    entity_id: id,
    old_values: { status: current.status },
    new_values: updates,
    description: `Application status changed from ${current.status} to ${newStatus} for ${current.applicant_first_name} ${current.applicant_last_name}`,
  })

  revalidatePath('/applications')
  revalidatePath(`/applications/${id}`)
  return { error: null, ok: true }
}

export async function approveAndCreateTenant(applicationId: string): Promise<ActionState> {
  const { supabase, user, companyId } = await currentContext()
  if (!user || !companyId) return { error: 'Not authenticated.' }

  // Fetch the full application
  const { data: app, error: appErr } = await supabase
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (appErr) return { error: appErr.message }
  if (!app) return { error: 'Application not found.' }

  // Duplicate tenant check by email
  const { data: existingTenant } = await supabase
    .from('tenants')
    .select('id, first_name, last_name')
    .eq('company_id', companyId)
    .eq('email', app.applicant_email)
    .maybeSingle()

  let tenantId: string

  if (existingTenant) {
    // Link to existing tenant rather than creating a duplicate
    tenantId = existingTenant.id
    await supabase.from('audit_logs').insert({
      company_id: companyId,
      user_id: user.id,
      action: 'updated',
      entity_type: 'application',
      entity_id: applicationId,
      new_values: { linked_tenant_id: tenantId, note: 'Linked to existing tenant on approval' },
      description: `Application approved and linked to existing tenant ${existingTenant.first_name} ${existingTenant.last_name}`,
    })
  } else {
    // Create new tenant record from application data
    const tenantPayload = {
      company_id: companyId,
      first_name: app.applicant_first_name as string,
      last_name: app.applicant_last_name as string,
      email: app.applicant_email as string,
      phone: app.applicant_phone as string | null,
      student_id: null as string | null,
      university: app.university as string | null,
      course: app.course as string | null,
      is_active: true,
      created_by: user.id,
    }

    const { data: newTenant, error: tenantErr } = await supabase
      .from('tenants')
      .insert(tenantPayload)
      .select('id')
      .single()

    if (tenantErr) return { error: `Failed to create tenant: ${tenantErr.message}` }
    tenantId = newTenant.id

    await supabase.from('audit_logs').insert({
      company_id: companyId,
      user_id: user.id,
      action: 'created',
      entity_type: 'tenant',
      entity_id: tenantId,
      new_values: tenantPayload,
      description: `Tenant created from approved application for ${app.applicant_first_name} ${app.applicant_last_name}`,
    })
  }

  // Update application: status=approved, linked_tenant_id
  const { error: updateErr } = await supabase
    .from('applications')
    .update({
      status: 'approved' as ApplicationStatus,
      linked_tenant_id: tenantId,
      updated_by: user.id,
    })
    .eq('id', applicationId)

  if (updateErr) return { error: `Tenant created but failed to update application: ${updateErr.message}` }

  await supabase.from('audit_logs').insert({
    company_id: companyId,
    user_id: user.id,
    action: 'status_changed',
    entity_type: 'application',
    entity_id: applicationId,
    old_values: { status: app.status },
    new_values: { status: 'approved', linked_tenant_id: tenantId },
    description: `Application approved for ${app.applicant_first_name} ${app.applicant_last_name}`,
  })

  revalidatePath('/applications')
  revalidatePath(`/applications/${applicationId}`)
  revalidatePath('/tenants')
  return { error: null, ok: true, tenantId }
}
