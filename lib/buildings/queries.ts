import { createClient } from '@/lib/supabase/server'

export interface BuildingRow {
  id: string
  name: string
  address: string
  suburb: string | null
  state: string | null
  postcode: string | null
  total_properties: number
  is_active: boolean
  manages_electricity: boolean
  manages_maintenance: boolean
  primary_manager_id: string | null
  primary_manager: { full_name: string | null } | null
  occupied_count: number
  available_count: number
}

export interface BuildingsResult {
  buildings: BuildingRow[]
  error: string | null
}

export async function getBuildings(options?: {
  electricityOnly?: boolean
  maintenanceOnly?: boolean
}): Promise<BuildingsResult> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('buildings')
      .select(`
        id, name, address, suburb, state, postcode,
        total_properties, is_active,
        manages_electricity, manages_maintenance,
        primary_manager_id,
        primary_manager:profiles!primary_manager_id(full_name)
      `)
      .eq('is_active', true)
      .order('name')

    if (options?.electricityOnly) query = query.eq('manages_electricity', true)
    if (options?.maintenanceOnly) query = query.eq('manages_maintenance', true)

    const { data: buildings, error } = await query
    if (error) return { buildings: [], error: error.message }
    if (!buildings?.length) return { buildings: [], error: null }

    const { data: props } = await supabase
      .from('properties')
      .select('building_id, status')
      .in('building_id', buildings.map((b) => b.id))
      .eq('is_active', true)

    const counts: Record<string, { occupied: number; available: number }> = {}
    for (const p of props ?? []) {
      if (!counts[p.building_id]) counts[p.building_id] = { occupied: 0, available: 0 }
      if (p.status === 'occupied') counts[p.building_id].occupied++
      if (p.status === 'available') counts[p.building_id].available++
    }

    const items: BuildingRow[] = (buildings as unknown as BuildingRow[]).map((b) => ({
      ...b,
      occupied_count: counts[b.id]?.occupied ?? 0,
      available_count: counts[b.id]?.available ?? 0,
    }))

    return { buildings: items, error: null }
  } catch (err) {
    return { buildings: [], error: err instanceof Error ? err.message : 'Failed to load buildings' }
  }
}
