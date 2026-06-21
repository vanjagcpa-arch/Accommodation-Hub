export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EditTenantForm } from './_components/edit-tenant-form'

async function getTenantForEdit(id: string) {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('tenants')
      .select('id, first_name, last_name, email, phone, date_of_birth, student_id, university, course, nationality, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, notes')
      .eq('id', id)
      .maybeSingle()
    return data
  } catch {
    return null
  }
}

export default async function EditTenantPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const tenant = await getTenantForEdit(id)
  if (!tenant) notFound()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/tenants" className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ChevronLeft className="h-4 w-4" />
          Tenants
        </Link>
        <span className="text-ink-faint">/</span>
        <Link href={`/tenants/${id}`} className="text-sm text-ink-muted hover:text-ink">
          {tenant.first_name} {tenant.last_name}
        </Link>
        <span className="text-ink-faint">/</span>
        <span className="text-sm text-ink font-medium">Edit</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-ink">Edit Tenant</h1>
        <p className="text-ink-muted text-sm mt-0.5">{tenant.first_name} {tenant.last_name}</p>
      </div>

      <EditTenantForm tenant={tenant} />
    </div>
  )
}
