export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { NewPropertyForm } from './_components/new-property-form'

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

export default async function NewPropertyPage() {
  const buildings = await getBuildings()

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

      <NewPropertyForm buildings={buildings} />
    </div>
  )
}
