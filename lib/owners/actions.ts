'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
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

export async function createOwner(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user, companyId } = await currentContext()
  if (!user || !companyId) {
    return { error: 'You must be signed in to a company workspace.' }
  }

  const firstName = str(formData, 'first_name')
  const lastName = str(formData, 'last_name')
  if (!firstName) return { error: 'First name is required.' }
  if (!lastName) return { error: 'Last name is required.' }

  const email = str(formData, 'email')

  if (email) {
    const { data: existing } = await supabase
      .from('owners')
      .select('id, first_name, last_name')
      .eq('company_id', companyId)
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return {
        error: `An owner with this email already exists: ${existing.first_name} ${existing.last_name}.`,
      }
    }
  }

  const payload = {
    company_id: companyId,
    first_name: firstName,
    last_name: lastName,
    email,
    phone: str(formData, 'phone'),
    company_name: str(formData, 'company_name'),
    notes: str(formData, 'notes'),
    is_active: true,
    created_by: user.id,
  }

  const { data, error } = await supabase
    .from('owners')
    .insert(payload)
    .select('id')
    .single()

  if (error) {
    console.error('[owners/createOwner]', error.message, { code: error.code })
    return { error: error.message }
  }

  await supabase.from('audit_logs').insert({
    company_id: companyId,
    user_id: user.id,
    action: 'created',
    entity_type: 'owner',
    entity_id: data.id,
    new_values: payload,
    description: `Created owner ${firstName} ${lastName}`,
  })

  revalidatePath('/owners')
  redirect('/owners')
}

export async function updateOwner(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user, companyId } = await currentContext()
  if (!user || !companyId) return { error: 'You must be signed in.' }

  const id = str(formData, 'id')
  if (!id) return { error: 'Owner ID missing.' }

  const firstName = str(formData, 'first_name')
  const lastName = str(formData, 'last_name')
  if (!firstName) return { error: 'First name is required.' }
  if (!lastName) return { error: 'Last name is required.' }

  const email = str(formData, 'email')

  if (email) {
    const { data: existing } = await supabase
      .from('owners')
      .select('id, first_name, last_name')
      .eq('company_id', companyId)
      .eq('email', email)
      .neq('id', id)
      .maybeSingle()

    if (existing) {
      return {
        error: `Email already used by ${existing.first_name} ${existing.last_name}.`,
      }
    }
  }

  const updates = {
    first_name: firstName,
    last_name: lastName,
    email,
    phone: str(formData, 'phone'),
    company_name: str(formData, 'company_name'),
    notes: str(formData, 'notes'),
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('owners')
    .update(updates)
    .eq('id', id)
    .eq('company_id', companyId)

  if (error) {
    console.error('[owners/updateOwner]', error.message, { id, code: error.code })
    return { error: error.message }
  }

  await supabase.from('audit_logs').insert({
    company_id: companyId,
    user_id: user.id,
    action: 'updated',
    entity_type: 'owner',
    entity_id: id,
    new_values: updates,
    description: `Updated owner ${firstName} ${lastName}`,
  })

  revalidatePath('/owners')
  redirect('/owners')
}

export async function toggleOwnerActive(id: string, active: boolean): Promise<ActionState> {
  const { supabase, user, companyId } = await currentContext()
  if (!user || !companyId) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('owners')
    .update({ is_active: active, updated_by: user.id })
    .eq('id', id)
    .eq('company_id', companyId)

  if (error) return { error: error.message }

  await supabase.from('audit_logs').insert({
    company_id: companyId,
    user_id: user.id,
    action: 'updated',
    entity_type: 'owner',
    entity_id: id,
    new_values: { is_active: active },
    description: `Owner ${active ? 'activated' : 'deactivated'}`,
  })

  revalidatePath('/owners')
  return { error: null, ok: true }
}
