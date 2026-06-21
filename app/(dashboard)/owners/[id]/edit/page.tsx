export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EditOwnerForm } from './_components/edit-owner-form'

async function getOwner(id: string) {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('owners')
      .select('id, first_name, last_name, email, phone, company_name, notes')
      .eq('id', id)
      .maybeSingle()
    return data
  } catch {
    return null
  }
}

export default async function EditOwnerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const owner = await getOwner(id)
  if (!owner) notFound()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/owners" className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ChevronLeft className="h-4 w-4" />
          Owners
        </Link>
        <span className="text-ink-faint">/</span>
        <span className="text-sm text-ink">{owner.first_name} {owner.last_name}</span>
        <span className="text-ink-faint">/</span>
        <span className="text-sm text-ink font-medium">Edit</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-ink">Edit Owner</h1>
        <p className="text-ink-muted text-sm mt-0.5">{owner.first_name} {owner.last_name}</p>
      </div>

      <EditOwnerForm owner={owner} />
    </div>
  )
}
