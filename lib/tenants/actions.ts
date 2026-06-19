'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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

export async function createTenant(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user, companyId } = await currentContext()
  if (!user || !companyId) {
    return { error: 'You must be signed in to a company workspace.' }
  }

  const firstName = str(formData, 'first_name')
  const lastName = str(formData, 'last_name')
  if (!firstName) return { error: 'First name is required.' }
  if (!lastName) return { error: 'Last name is required.' }

  const email = str(formData, 'email')

  // Duplicate check: same email within the same company
  if (email) {
    const { data: existing } = await supabase
      .from('tenants')
      .select('id, first_name, last_name')
      .eq('company_id', companyId)
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return {
        error: `A tenant with this email already exists: ${existing.first_name} ${existing.last_name}. Check the Tenants list before creating a duplicate.`,
      }
    }
  }

  const payload = {
    company_id: companyId,
    first_name: firstName,
    last_name: lastName,
    email,
    phone: str(formData, 'phone'),
    date_of_birth: str(formData, 'date_of_birth'),
    student_id: str(formData, 'student_id'),
    university: str(formData, 'university'),
    course: str(formData, 'course'),
    nationality: str(formData, 'nationality'),
    emergency_contact_name: str(formData, 'emergency_contact_name'),
    emergency_contact_phone: str(formData, 'emergency_contact_phone'),
    emergency_contact_relationship: str(formData, 'emergency_contact_relationship'),
    notes: str(formData, 'notes'),
    is_active: true,
    created_by: user.id,
  }

  const { data, error } = await supabase
    .from('tenants')
    .insert(payload)
    .select('id')
    .single()

  if (error) return { error: error.message }

  await supabase.from('audit_logs').insert({
    company_id: companyId,
    user_id: user.id,
    action: 'created',
    entity_type: 'tenant',
    entity_id: data.id,
    new_values: payload,
    description: `Created tenant ${firstName} ${lastName}`,
  })

  revalidatePath('/tenants')
  return { error: null, ok: true }
}

export async function updateTenant(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user, companyId } = await currentContext()
  if (!user || !companyId) {
    return { error: 'You must be signed in to a company workspace.' }
  }

  const id = str(formData, 'id')
  if (!id) return { error: 'Tenant ID is required.' }

  const firstName = str(formData, 'first_name')
  const lastName = str(formData, 'last_name')
  if (!firstName) return { error: 'First name is required.' }
  if (!lastName) return { error: 'Last name is required.' }

  const email = str(formData, 'email')

  // Duplicate check: another tenant with same email in the same company
  if (email) {
    const { data: existing } = await supabase
      .from('tenants')
      .select('id, first_name, last_name')
      .eq('company_id', companyId)
      .eq('email', email)
      .neq('id', id)
      .maybeSingle()

    if (existing) {
      return {
        error: `Email already used by ${existing.first_name} ${existing.last_name}. Each tenant must have a unique email address.`,
      }
    }
  }

  // Fetch old values for audit log
  const { data: oldData } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  const updates = {
    first_name: firstName,
    last_name: lastName,
    email,
    phone: str(formData, 'phone'),
    date_of_birth: str(formData, 'date_of_birth'),
    student_id: str(formData, 'student_id'),
    university: str(formData, 'university'),
    course: str(formData, 'course'),
    nationality: str(formData, 'nationality'),
    emergency_contact_name: str(formData, 'emergency_contact_name'),
    emergency_contact_phone: str(formData, 'emergency_contact_phone'),
    emergency_contact_relationship: str(formData, 'emergency_contact_relationship'),
    notes: str(formData, 'notes'),
    updated_by: user.id,
  }

  const { error } = await supabase
    .from('tenants')
    .update(updates)
    .eq('id', id)
    .eq('company_id', companyId)

  if (error) return { error: error.message }

  await supabase.from('audit_logs').insert({
    company_id: companyId,
    user_id: user.id,
    action: 'updated',
    entity_type: 'tenant',
    entity_id: id,
    old_values: oldData ?? null,
    new_values: updates,
    description: `Updated tenant ${firstName} ${lastName}`,
  })

  revalidatePath('/tenants')
  revalidatePath(`/tenants/${id}`)
  return { error: null, ok: true }
}

export async function toggleTenantActive(id: string, active: boolean): Promise<ActionState> {
  const { supabase, user, companyId } = await currentContext()
  if (!user || !companyId) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('tenants')
    .update({ is_active: active, updated_by: user.id })
    .eq('id', id)
    .eq('company_id', companyId)

  if (error) return { error: error.message }

  await supabase.from('audit_logs').insert({
    company_id: companyId,
    user_id: user.id,
    action: 'updated',
    entity_type: 'tenant',
    entity_id: id,
    new_values: { is_active: active },
    description: `Tenant ${active ? 'activated' : 'deactivated'}`,
  })

  revalidatePath('/tenants')
  revalidatePath(`/tenants/${id}`)
  return { error: null, ok: true }
}
