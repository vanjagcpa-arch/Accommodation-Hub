'use server'

import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Generates (or rotates) a property's public triage token. RLS on `properties`
// restricts UPDATE to super_admin/admin/internal_manager in the same company,
// so a non-manager call fails the WITH CHECK and returns an error.
export async function generateTriageToken(propertyId: string): Promise<{ token?: string; error?: string }> {
  if (!propertyId) return { error: 'Missing property.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  const token = randomBytes(18).toString('base64url') // ~24 url-safe chars

  const { error } = await supabase
    .from('properties')
    .update({ triage_token: token })
    .eq('id', propertyId)
    .select('id')
    .single()

  if (error) {
    return { error: 'Could not update this property. You may not have permission.' }
  }

  revalidatePath('/maintenance/triage')
  return { token }
}

export async function revokeTriageToken(propertyId: string): Promise<{ ok?: boolean; error?: string }> {
  if (!propertyId) return { error: 'Missing property.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  const { error } = await supabase
    .from('properties')
    .update({ triage_token: null })
    .eq('id', propertyId)
    .select('id')
    .single()

  if (error) return { error: 'Could not update this property. You may not have permission.' }

  revalidatePath('/maintenance/triage')
  return { ok: true }
}
