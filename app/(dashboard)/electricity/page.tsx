export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import ElectricityClient from './_components/electricity-client'
import type { ElecBuilding } from './_components/electricity-client'

async function getElectricityBuildings(): Promise<ElecBuilding[]> {
  try {
    const supabase = await createClient()
    const [buildingsRes, propertiesRes] = await Promise.all([
      supabase
        .from('buildings')
        .select('id, name, address, suburb, total_properties')
        .eq('manages_electricity', true)
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('properties')
        .select('building_id, status')
        .eq('is_active', true),
    ])

    const buildings = buildingsRes.data ?? []
    const properties = propertiesRes.data ?? []

    return buildings.map(b => ({
      id: b.id,
      name: b.name,
      address: [b.address, b.suburb].filter(Boolean).join(', '),
      units: (b.total_properties as number) || properties.filter(p => p.building_id === b.id).length,
      occupied: properties.filter(p => p.building_id === b.id && p.status === 'occupied').length,
    }))
  } catch {
    return []
  }
}

export default async function ElectricityPage() {
  const buildings = await getElectricityBuildings()
  return <ElectricityClient initialBuildings={buildings} />
}
