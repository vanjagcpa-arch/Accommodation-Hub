export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import SettingsClient from './_components/settings-client'

async function getSettingsData() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const profileRes = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle()

    const companyId = profileRes.data?.company_id
    if (!companyId) return null

    const [companyRes, usersRes, buildingCountRes, propertyCountRes] = await Promise.all([
      supabase
        .from('companies')
        .select('id, name, abn, phone, email, address')
        .eq('id', companyId)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('id, full_name, email, role, is_active')
        .eq('company_id', companyId)
        .order('full_name'),
      supabase
        .from('buildings')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
    ])

    return {
      company: companyRes.data ?? null,
      users: usersRes.data ?? [],
      buildingCount: buildingCountRes.count ?? 0,
      propertyCount: propertyCountRes.count ?? 0,
    }
  } catch {
    return null
  }
}

export default async function SettingsPage() {
  const data = await getSettingsData()
  return (
    <SettingsClient
      company={data?.company ?? null}
      users={data?.users ?? []}
      buildingCount={data?.buildingCount ?? 0}
      propertyCount={data?.propertyCount ?? 0}
    />
  )
}
