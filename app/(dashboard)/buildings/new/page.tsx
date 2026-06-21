export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { NewBuildingForm } from './_components/new-building-form'

async function getManagers() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .order('full_name')
    return (data ?? []) as { id: string; full_name: string | null }[]
  } catch {
    return []
  }
}

export default async function NewBuildingPage() {
  const managers = await getManagers()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/buildings" className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ChevronLeft className="h-4 w-4" />
          Buildings
        </Link>
        <span className="text-ink-faint">/</span>
        <span className="text-sm text-ink font-medium">New Building</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-ink">Add Building</h1>
        <p className="text-ink-muted text-sm mt-0.5">Create a new building in your portfolio</p>
      </div>

      <NewBuildingForm managers={managers} />
    </div>
  )
}
