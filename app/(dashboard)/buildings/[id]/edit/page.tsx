export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EditBuildingForm } from './_components/edit-building-form'

async function getBuilding(id: string) {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('buildings')
      .select('id, name, description, address, suburb, state, postcode, country, notes, primary_manager_id, manages_electricity, manages_maintenance, reapit_external_id, listonce_external_id, myob_external_id')
      .eq('id', id)
      .maybeSingle()
    return data
  } catch {
    return null
  }
}

async function getManagers() {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('profiles').select('id, full_name').order('full_name')
    return (data ?? []) as { id: string; full_name: string | null }[]
  } catch {
    return []
  }
}

export default async function EditBuildingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [building, managers] = await Promise.all([getBuilding(id), getManagers()])
  if (!building) notFound()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/buildings" className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ChevronLeft className="h-4 w-4" />
          Buildings
        </Link>
        <span className="text-ink-faint">/</span>
        <span className="text-sm text-ink">{building.name}</span>
        <span className="text-ink-faint">/</span>
        <span className="text-sm text-ink font-medium">Edit</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-ink">Edit Building</h1>
        <p className="text-ink-muted text-sm mt-0.5">{building.name}</p>
      </div>

      <EditBuildingForm building={building} managers={managers} />
    </div>
  )
}
