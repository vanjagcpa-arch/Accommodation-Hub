'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface ActionState {
  error: string | null
}

const MANAGED_STATUS_VALUES = ['managed', 'external'] as const
type ManagedStatus = typeof MANAGED_STATUS_VALUES[number]

function managedStatus(formData: FormData): ManagedStatus {
  const v = formData.get('managed_status')
  return v === 'external' ? 'external' : 'managed'
}

function friendlyDbError(msg: string): string {
  if (msg.includes('managed_status_check')) return 'Invalid management type — must be "Managed" or "External".'
  if (msg.includes('properties_status_check')) return 'Invalid status value selected.'
  return msg
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
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .maybeSingle()
  return { supabase, user, companyId: (profile?.company_id as string | null) ?? null }
}

export async function createProperty(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user, companyId } = await currentContext()
  if (!user || !companyId) {
    return { error: 'You must be signed in to a company workspace.' }
  }

  const buildingId = str(formData, 'building_id')
  if (!buildingId) return { error: 'Building is required.' }

  const unitNumber = str(formData, 'unit_number')
  if (!unitNumber) return { error: 'Unit number is required.' }

  // Duplicate check: same unit number in same building
  const { data: existing } = await supabase
    .from('properties')
    .select('id')
    .eq('company_id', companyId)
    .eq('building_id', buildingId)
    .eq('unit_number', unitNumber)
    .eq('is_active', true)
    .maybeSingle()

  if (existing) {
    return { error: `Unit ${unitNumber} already exists in this building.` }
  }

  const features = formData.getAll('features').filter(v => typeof v === 'string') as string[]

  const payload = {
    company_id: companyId,
    building_id: buildingId,
    unit_number: unitNumber,
    property_type: str(formData, 'property_type'),
    managed_status: managedStatus(formData),
    bedrooms: num(formData, 'bedrooms') ?? 1,
    bathrooms: num(formData, 'bathrooms') ?? 1,
    floor_level: num(formData, 'floor_level'),
    size_sqm: num(formData, 'size_sqm'),
    rent_amount: num(formData, 'rent_amount'),
    bond_amount: num(formData, 'bond_amount'),
    status: str(formData, 'status') ?? 'available',
    available_date: str(formData, 'available_date'),
    features: features.length > 0 ? features : null,
    notes: str(formData, 'notes'),
    internal_notes: str(formData, 'internal_notes'),
    agent_visible: formData.get('agent_visible') === 'on',
    owner_id: str(formData, 'owner_id'),
    reapit_external_id: str(formData, 'reapit_external_id'),
    listonce_external_id: str(formData, 'listonce_external_id'),
    ezidebit_code: str(formData, 'ezidebit_code'),
    is_active: true,
    created_by: user.id,
  }

  const { data, error } = await supabase
    .from('properties')
    .insert(payload)
    .select('id')
    .single()

  if (error) {
    console.error('[properties/createProperty]', error.message, { code: error.code })
    return { error: friendlyDbError(error.message) }
  }

  const { error: refErr } = await supabase.from('property_source_refs').upsert(
    { property_id: data.id, source: 'manual', sync_status: 'not_connected' },
    { onConflict: 'property_id,source', ignoreDuplicates: true }
  )
  if (refErr) console.error('[properties/createProperty] source_ref', refErr.message)

  const { error: logErr } = await supabase.from('property_sync_logs').insert({
    property_id: data.id,
    source: 'manual',
    status: 'success',
    message: `Unit ${unitNumber} created manually`,
    fields_updated: Object.keys(payload),
    triggered_by: user.id,
  })
  if (logErr) console.error('[properties/createProperty] sync_log', logErr.message)

  await supabase.from('audit_logs').insert({
    company_id: companyId,
    user_id: user.id,
    action: 'created',
    entity_type: 'property',
    entity_id: data.id,
    description: `Created property Unit ${unitNumber}`,
  })

  revalidatePath('/properties')
  revalidatePath('/portfolio')
  redirect('/properties')
}

export async function updateProperty(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user, companyId } = await currentContext()
  if (!user || !companyId) return { error: 'You must be signed in.' }

  const id = str(formData, 'id')
  if (!id) return { error: 'Property ID missing.' }

  const buildingId = str(formData, 'building_id')
  if (!buildingId) return { error: 'Building is required.' }

  const unitNumber = str(formData, 'unit_number')
  if (!unitNumber) return { error: 'Unit number is required.' }

  // Duplicate check: same unit number in same building, excluding this property
  const { data: existing } = await supabase
    .from('properties')
    .select('id')
    .eq('company_id', companyId)
    .eq('building_id', buildingId)
    .eq('unit_number', unitNumber)
    .eq('is_active', true)
    .neq('id', id)
    .maybeSingle()

  if (existing) {
    return { error: `Unit ${unitNumber} already exists in this building.` }
  }

  const features = formData.getAll('features').filter(v => typeof v === 'string') as string[]

  const updates = {
    building_id: buildingId,
    unit_number: unitNumber,
    property_type: str(formData, 'property_type'),
    managed_status: managedStatus(formData),
    bedrooms: num(formData, 'bedrooms') ?? 1,
    bathrooms: num(formData, 'bathrooms') ?? 1,
    floor_level: num(formData, 'floor_level'),
    size_sqm: num(formData, 'size_sqm'),
    rent_amount: num(formData, 'rent_amount'),
    bond_amount: num(formData, 'bond_amount'),
    status: str(formData, 'status') ?? 'available',
    available_date: str(formData, 'available_date'),
    features: features.length > 0 ? features : null,
    notes: str(formData, 'notes'),
    internal_notes: str(formData, 'internal_notes'),
    agent_visible: formData.get('agent_visible') === 'on',
    owner_id: str(formData, 'owner_id'),
    assigned_manager_id: str(formData, 'assigned_manager_id'),
    reapit_external_id: str(formData, 'reapit_external_id'),
    listonce_external_id: str(formData, 'listonce_external_id'),
    ezidebit_code: str(formData, 'ezidebit_code'),
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', id)
    .eq('company_id', companyId)

  if (error) {
    console.error('[properties/updateProperty]', error.message, { id, code: error.code })
    return { error: friendlyDbError(error.message) }
  }

  const { error: refErr } = await supabase.from('property_source_refs').upsert(
    { property_id: id, source: 'manual', sync_status: 'not_connected' },
    { onConflict: 'property_id,source', ignoreDuplicates: true }
  )
  if (refErr) console.error('[properties/updateProperty] source_ref', refErr.message)

  const { error: logErr } = await supabase.from('property_sync_logs').insert({
    property_id: id,
    source: 'manual',
    status: 'success',
    message: `Unit ${unitNumber} updated manually`,
    fields_updated: Object.keys(updates),
    triggered_by: user.id,
  })
  if (logErr) console.error('[properties/updateProperty] sync_log', logErr.message)

  await supabase.from('audit_logs').insert({
    company_id: companyId,
    user_id: user.id,
    action: 'updated',
    entity_type: 'property',
    entity_id: id,
    new_values: updates,
    description: `Updated property Unit ${unitNumber}`,
  })

  revalidatePath('/properties')
  revalidatePath(`/properties/${id}`)
  revalidatePath('/portfolio')
  redirect('/properties')
}
