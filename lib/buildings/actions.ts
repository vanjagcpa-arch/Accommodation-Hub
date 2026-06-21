'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export interface ActionState {
  error: string | null
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

export async function createBuilding(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user, companyId } = await currentContext()
  if (!user || !companyId) {
    return { error: 'You must be signed in to a company workspace.' }
  }

  const name = str(formData, 'name')
  if (!name) return { error: 'Building name is required.' }

  const address = str(formData, 'address')
  if (!address) return { error: 'Street address is required.' }

  const suburb = str(formData, 'suburb')
  if (!suburb) return { error: 'Suburb is required.' }

  const state = str(formData, 'state')
  if (!state) return { error: 'State is required.' }

  const postcode = str(formData, 'postcode')
  if (!postcode) return { error: 'Postcode is required.' }

  const payload = {
    company_id: companyId,
    name,
    address,
    suburb,
    state,
    postcode,
    country: str(formData, 'country') ?? 'Australia',
    description: str(formData, 'description'),
    notes: str(formData, 'notes'),
    primary_manager_id: str(formData, 'primary_manager_id'),
    reapit_external_id: str(formData, 'reapit_external_id'),
    listonce_external_id: str(formData, 'listonce_external_id'),
    myob_external_id: str(formData, 'myob_external_id'),
    manages_electricity: formData.get('manages_electricity') === 'on',
    manages_maintenance: formData.get('manages_maintenance') === 'on',
    is_active: true,
    created_by: user.id,
  }

  const { data, error } = await supabase
    .from('buildings')
    .insert(payload)
    .select('id')
    .single()

  if (error) {
    console.error('[buildings/createBuilding]', error.message, { code: error.code })
    return { error: error.message }
  }

  await supabase.from('audit_logs').insert({
    company_id: companyId,
    user_id: user.id,
    action: 'created',
    entity_type: 'building',
    entity_id: data.id,
    new_values: payload,
    description: `Created building: ${name}`,
  })

  revalidatePath('/buildings')
  revalidatePath('/portfolio')
  redirect('/buildings')
}

export async function updateBuilding(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user, companyId } = await currentContext()
  if (!user || !companyId) return { error: 'You must be signed in.' }

  const id = str(formData, 'id')
  if (!id) return { error: 'Building ID missing.' }

  const name = str(formData, 'name')
  if (!name) return { error: 'Building name is required.' }
  const address = str(formData, 'address')
  if (!address) return { error: 'Street address is required.' }
  const suburb = str(formData, 'suburb')
  if (!suburb) return { error: 'Suburb is required.' }
  const state = str(formData, 'state')
  if (!state) return { error: 'State is required.' }
  const postcode = str(formData, 'postcode')
  if (!postcode) return { error: 'Postcode is required.' }

  const updates = {
    name,
    address,
    suburb,
    state,
    postcode,
    country: str(formData, 'country') ?? 'Australia',
    description: str(formData, 'description'),
    notes: str(formData, 'notes'),
    primary_manager_id: str(formData, 'primary_manager_id'),
    reapit_external_id: str(formData, 'reapit_external_id'),
    listonce_external_id: str(formData, 'listonce_external_id'),
    myob_external_id: str(formData, 'myob_external_id'),
    manages_electricity: formData.get('manages_electricity') === 'on',
    manages_maintenance: formData.get('manages_maintenance') === 'on',
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('buildings')
    .update(updates)
    .eq('id', id)
    .eq('company_id', companyId)

  if (error) {
    console.error('[buildings/updateBuilding]', error.message, { id, code: error.code })
    return { error: error.message }
  }

  await supabase.from('audit_logs').insert({
    company_id: companyId,
    user_id: user.id,
    action: 'updated',
    entity_type: 'building',
    entity_id: id,
    new_values: updates,
    description: `Updated building: ${name}`,
  })

  revalidatePath('/buildings')
  revalidatePath('/portfolio')
  redirect('/buildings')
}

export async function toggleBuildingElectricity(
  buildingId: string,
  manages: boolean
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('buildings')
      .update({ manages_electricity: manages, updated_at: new Date().toISOString() })
      .eq('id', buildingId)

    if (error) {
      console.error('[buildings/toggleBuildingElectricity]', error.message)
      return { error: error.message }
    }

    await supabase.from('audit_logs').insert({
      action: 'updated',
      entity_type: 'building',
      entity_id: buildingId,
      new_values: { manages_electricity: manages },
      description: manages ? 'Electricity management enabled' : 'Electricity management disabled',
    })

    revalidatePath('/buildings')
    revalidatePath('/electricity')
    return { error: null }
  } catch (err) {
    console.error('[buildings/toggleBuildingElectricity]', err instanceof Error ? err.message : err)
    return { error: err instanceof Error ? err.message : 'Failed to update building' }
  }
}

export async function toggleBuildingMaintenance(
  buildingId: string,
  manages: boolean
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('buildings')
      .update({ manages_maintenance: manages, updated_at: new Date().toISOString() })
      .eq('id', buildingId)

    if (error) {
      console.error('[buildings/toggleBuildingMaintenance]', error.message)
      return { error: error.message }
    }

    await supabase.from('audit_logs').insert({
      action: 'updated',
      entity_type: 'building',
      entity_id: buildingId,
      new_values: { manages_maintenance: manages },
      description: manages ? 'Maintenance management enabled' : 'Maintenance management disabled',
    })

    revalidatePath('/buildings')
    revalidatePath('/maintenance')
    return { error: null }
  } catch (err) {
    console.error('[buildings/toggleBuildingMaintenance]', err instanceof Error ? err.message : err)
    return { error: err instanceof Error ? err.message : 'Failed to update building' }
  }
}
