export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import ElectricityClient from './_components/electricity-client'
import type { ElecBuilding } from './_components/electricity-client'

async function getElectricityBuildings(): Promise<ElecBuilding[]> {
  try {
    const supabase = await createClient()
    const [buildingsRes, propsRes] = await Promise.all([
      supabase
        .from('buildings')
        .select('id, name, address, suburb')
        .eq('is_active', true)
        .eq('manages_electricity', true)
        .order('name'),
      supabase
        .from('properties')
        .select('building_id, status')
        .eq('is_active', true),
    ])
    const props = propsRes.data ?? []
    const unitCountMap: Record<string, number> = {}
    const occupiedMap: Record<string, number> = {}
    for (const p of props) {
      const bid = p.building_id as string
      if (!bid) continue
      unitCountMap[bid] = (unitCountMap[bid] ?? 0) + 1
      if (p.status === 'leased' || p.status === 'occupied') {
        occupiedMap[bid] = (occupiedMap[bid] ?? 0) + 1
      }
    }
    return (buildingsRes.data ?? []).map(b => ({
      id: b.id,
      name: b.name,
      address: [b.address, b.suburb].filter(Boolean).join(', '),
      units: unitCountMap[b.id] ?? 0,
      occupied: occupiedMap[b.id] ?? 0,
    }))
  } catch {
    return []
  }
}

export default async function ElectricityPage() {
  const buildings = await getElectricityBuildings()
  return <ElectricityClient initialBuildings={buildings} />
}
