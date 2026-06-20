'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleBuildingElectricity(
  buildingId: string,
  manages: boolean
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('buildings')
      .update({ manages_electricity: manages, updated_at: new Date().toISOString() })
      .eq('id', buildingId)

    if (error) {
      console.error('[buildings/toggleBuildingElectricity]', error.message)
      return { error: error.message }
    }

    await supabase.from('audit_logs').insert({
      action: 'updated',
      entity_type: 'building',
      entity_id: buildingId,
      new_values: { manages_electricity: manages },
      description: manages ? 'Electricity management enabled' : 'Electricity management disabled',
    })

    revalidatePath('/buildings')
    revalidatePath('/electricity')
    return { error: null }
  } catch (err) {
    console.error('[buildings/toggleBuildingElectricity]', err instanceof Error ? err.message : err)
    return { error: err instanceof Error ? err.message : 'Failed to update building' }
  }
}

export async function toggleBuildingMaintenance(
  buildingId: string,
  manages: boolean
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('buildings')
      .update({ manages_maintenance: manages, updated_at: new Date().toISOString() })
      .eq('id', buildingId)

    if (error) {
      console.error('[buildings/toggleBuildingMaintenance]', error.message)
      return { error: error.message }
    }

    await supabase.from('audit_logs').insert({
      action: 'updated',
      entity_type: 'building',
      entity_id: buildingId,
      new_values: { manages_maintenance: manages },
      description: manages ? 'Maintenance management enabled' : 'Maintenance management disabled',
    })

    revalidatePath('/buildings')
    revalidatePath('/maintenance')
    return { error: null }
  } catch (err) {
    console.error('[buildings/toggleBuildingMaintenance]', err instanceof Error ? err.message : err)
    return { error: err instanceof Error ? err.message : 'Failed to update building' }
  }
}
