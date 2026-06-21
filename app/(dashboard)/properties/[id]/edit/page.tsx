export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EditPropertyForm } from './_components/edit-property-form'

async function getProperty(id: string) {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('properties')
      .select('id, building_id, unit_number, property_type, bedrooms, bathrooms, floor_level, size_sqm, rent_amount, bond_amount, status, available_date, features, notes, internal_notes, agent_visible, reapit_external_id, listonce_external_id, ezidebit_code')
      .eq('id', id)
      .maybeSingle()
    return data
  } catch {
    return null
  }
}

async function getBuildings() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('buildings')
      .select('id, name, address, suburb')
      .eq('is_active', true)
      .order('name')
    return (data ?? []) as { id: string; name: string; address: string | null; suburb: string | null }[]
  } catch {
    return []
  }
}

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [property, buildings] = await Promise.all([getProperty(id), getBuildings()])
  if (!property) notFound()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/properties" className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ChevronLeft className="h-4 w-4" />
          Properties
        </Link>
        <span className="text-ink-faint">/</span>
        <Link href={`/properties/${id}`} className="text-sm text-ink-muted hover:text-ink">Unit {property.unit_number}</Link>
        <span className="text-ink-faint">/</span>
        <span className="text-sm text-ink font-medium">Edit</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-ink">Edit Property</h1>
        <p className="text-ink-muted text-sm mt-0.5">Unit {property.unit_number}</p>
      </div>

      <EditPropertyForm property={property} buildings={buildings} />
    </div>
  )
}
