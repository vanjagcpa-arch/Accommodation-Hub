'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface ActionState {
  error: string | null
  ok?: boolean
}

const VALID_ROLES = [
  'admin',
  'internal_manager',
  'external_manager',
  'referral_agent',
  'maintenance_staff',
  'read_only',
]

async function currentContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, role: null, companyId: null as string | null }
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .maybeSingle()
  return {
    supabase,
    user,
    role: profile?.role as string | null,
    companyId: (profile?.company_id as string | null) ?? null,
  }
}

export async function inviteUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user, role, companyId } = await currentContext()
  if (!user || !companyId) return { error: 'You must be signed in to a company workspace.' }
  if (!['super_admin', 'admin'].includes(role ?? '')) {
    return { error: 'You do not have permission to invite users.' }
  }

  const email = (formData.get('email') as string ?? '').trim().toLowerCase()
  if (!email) return { error: 'Email is required.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Invalid email address.' }

  const fullName = (formData.get('full_name') as string ?? '').trim() || null
  const inviteRole = (formData.get('role') as string ?? '').trim()
  if (!VALID_ROLES.includes(inviteRole)) return { error: 'Invalid role selected.' }

  const admin = createAdminClient()

  // Check across ALL companies to prevent cross-tenant account takeover
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('company_id')
    .eq('email', email)
    .maybeSingle()

  if (existingProfile) {
    if (existingProfile.company_id !== companyId) {
      return { error: 'This email is already associated with another organisation.' }
    }
    return { error: 'A user with this email already exists in your organisation.' }
  }

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
  })

  if (error) {
    console.error('[users/inviteUser]', error.message)
    return { error: error.message }
  }

  if (data.user) {
    const { error: upsertError } = await admin.from('profiles').upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      role: inviteRole,
      company_id: companyId,
      is_active: true,
    }, { onConflict: 'id' })

    if (upsertError) {
      console.error('[users/inviteUser] profile upsert failed', upsertError.message)
      return { error: 'Failed to set up user profile. Please try again.' }
    }

    await supabase.from('audit_logs').insert({
      company_id: companyId,
      user_id: user.id,
      action: 'created',
      entity_type: 'user',
      entity_id: data.user.id,
      description: `Invited ${email}${fullName ? ` (${fullName})` : ''} as ${inviteRole}`,
    })
  }

  revalidatePath('/settings')
  return { error: null, ok: true }
}

export async function updateUserRole(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user, role, companyId } = await currentContext()
  if (!user || !companyId) return { error: 'You must be signed in.' }
  if (!['super_admin', 'admin'].includes(role ?? '')) {
    return { error: 'You do not have permission to change user roles.' }
  }

  const targetId = (formData.get('user_id') as string ?? '').trim()
  if (!targetId) return { error: 'User ID missing.' }
  if (targetId === user.id) return { error: 'You cannot change your own role here.' }

  const newRole = (formData.get('role') as string ?? '').trim()
  if (!VALID_ROLES.includes(newRole)) return { error: 'Invalid role selected.' }

  const isActive = formData.get('is_active') === 'on'

  const { data: updated, error } = await supabase
    .from('profiles')
    .update({ role: newRole, is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', targetId)
    .eq('company_id', companyId)
    .select('id')

  if (error) {
    console.error('[users/updateUserRole]', error.message)
    return { error: error.message }
  }

  if (!updated || updated.length === 0) {
    return { error: 'User not found in your organisation.' }
  }

  await supabase.from('audit_logs').insert({
    company_id: companyId,
    user_id: user.id,
    action: 'updated',
    entity_type: 'user',
    entity_id: targetId,
    description: `Changed user role to ${newRole}, active=${isActive}`,
  })

  revalidatePath('/settings')
  return { error: null, ok: true }
}
