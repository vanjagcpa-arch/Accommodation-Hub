export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import SettingsClient from './_components/settings-client'
import type { UserRow, CompanyRow } from './_components/settings-client'

async function getSettingsData(): Promise<{
  company: CompanyRow | null
  users: UserRow[]
  buildingCount: number
  propertyCount: number
} | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const profileRes = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle()

    const company_id = profileRes.data?.company_id
    if (!company_id) return { company: null, users: [], buildingCount: 0, propertyCount: 0 }

    const [companyRes, usersRes, buildingCountRes, propertyCountRes] = await Promise.all([
      supabase
        .from('companies')
        .select('id, name, abn, address, phone, email')
        .eq('id', company_id)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('id, email, full_name, role, is_active')
        .eq('company_id', company_id)
        .order('full_name'),
      supabase
        .from('buildings')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', company_id)
        .eq('is_active', true),
      supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
    ])

    return {
      company: companyRes.data ?? null,
      users: (usersRes.data ?? []) as UserRow[],
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
