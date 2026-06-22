export const dynamic = 'force-dynamic'

import { getTenants } from '@/lib/tenants/queries'
import { createClient } from '@/lib/supabase/server'
import TenantsClient from './_components/tenants-client'

type PageProps = {
  searchParams: Promise<{ q?: string; building?: string; university?: string; status?: string; page?: string }>
}

async function getBuildings() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('buildings')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
    return (data ?? []) as { id: string; name: string }[]
  } catch {
    return []
  }
}

export default async function TenantsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const filters = {
    q: params.q,
    building: params.building,
    university: params.university,
    status: params.status as 'active' | 'inactive' | 'all' | undefined,
    page,
  }

  const [{ tenants, total, error }, buildings] = await Promise.all([
    getTenants(filters),
    getBuildings(),
  ])

  return (
    <TenantsClient
      tenants={tenants}
      buildings={buildings}
      error={error}
      filters={filters}
      total={total}
      page={page}
    />
  )
}
