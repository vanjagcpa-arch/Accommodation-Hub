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
      .select('id, building_id, unit_number, property_type, managed_status, bedrooms, bathrooms, floor_level, size_sqm, rent_amount, bond_amount, status, available_date, features, notes, internal_notes, agent_visible, owner_id, assigned_manager_id, reapit_external_id, listonce_external_id, ezidebit_code')
      .eq('id', id)
      .maybeSingle()
    return data
  } catch {
    return null
  }
}

async function getFormData() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { buildings: [], managers: [], owners: [] }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle()
    if (!profile?.company_id) return { buildings: [], managers: [], owners: [] }

    const [buildingsRes, managersRes, ownersRes] = await Promise.all([
      supabase
        .from('buildings')
        .select('id, name, address, suburb')
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('profiles')
        .select('id, full_name')
        .eq('company_id', profile.company_id)
        .eq('is_active', true)
        .order('full_name'),
      supabase
        .from('owners')
        .select('id, first_name, last_name, company_name')
        .eq('is_active', true)
        .order('last_name'),
    ])

    return {
      buildings: (buildingsRes.data ?? []) as { id: string; name: string; address: string | null; suburb: string | null }[],
      managers: (managersRes.data ?? []) as { id: string; full_name: string | null }[],
      owners: (ownersRes.data ?? []) as { id: string; first_name: string; last_name: string; company_name: string | null }[],
    }
  } catch {
    return { buildings: [], managers: [], owners: [] }
  }
}

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [property, { buildings, managers, owners }] = await Promise.all([
    getProperty(id),
    getFormData(),
  ])
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

      <EditPropertyForm property={property} buildings={buildings} managers={managers} owners={owners} />
    </div>
  )
}
