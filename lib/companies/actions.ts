'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface ActionState {
  error: string | null
}

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key)
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t === '' ? null : t
}

export async function createCompany(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .maybeSingle()

  if (existingProfile?.company_id) redirect('/dashboard')

  const name = str(formData, 'name')
  if (!name) return { error: 'Company name is required.' }

  const admin = createAdminClient()

  const { data: company, error: companyError } = await admin
    .from('companies')
    .insert({
      name,
      abn: str(formData, 'abn'),
      address: str(formData, 'address'),
      phone: str(formData, 'phone'),
      email: str(formData, 'email'),
    })
    .select('id')
    .single()

  if (companyError || !company) {
    console.error('[companies/createCompany]', companyError?.message)
    return { error: 'Failed to create workspace. Please try again.' }
  }

  const { error: profileError } = await admin
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email,
      company_id: company.id,
      role: 'admin',
      is_active: true,
    }, { onConflict: 'id' })

  if (profileError) {
    console.error('[companies/createCompany] profile link failed', profileError.message)
    return { error: 'Workspace created but failed to link your account. Please contact support.' }
  }

  await admin.from('audit_logs').insert({
    company_id: company.id,
    user_id: user.id,
    action: 'created',
    entity_type: 'company',
    entity_id: company.id,
    description: `Created workspace "${name}"`,
  }).then(({ error }) => {
    if (error) console.error('[companies/createCompany] audit log failed', error.message)
  })

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
