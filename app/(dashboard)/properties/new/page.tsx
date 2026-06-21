export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { NewPropertyForm } from './_components/new-property-form'

async function getFormData() {
  try {
    const supabase = await createClient()
    const [buildingsRes, ownersRes] = await Promise.all([
      supabase
        .from('buildings')
        .select('id, name, address, suburb')
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('owners')
        .select('id, first_name, last_name, company_name')
        .eq('is_active', true)
        .order('last_name'),
    ])
    return {
      buildings: (buildingsRes.data ?? []) as { id: string; name: string; address: string | null; suburb: string | null }[],
      owners: (ownersRes.data ?? []) as { id: string; first_name: string; last_name: string; company_name: string | null }[],
    }
  } catch {
    return { buildings: [], owners: [] }
  }
}

export default async function NewPropertyPage() {
  const { buildings, owners } = await getFormData()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/properties" className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ChevronLeft className="h-4 w-4" />
          Properties
        </Link>
        <span className="text-ink-faint">/</span>
        <span className="text-sm text-ink font-medium">New Property</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-ink">Add Property</h1>
        <p className="text-ink-muted text-sm mt-0.5">Add a new property to a building</p>
      </div>

      <NewPropertyForm buildings={buildings} owners={owners} />
    </div>
  )
}
