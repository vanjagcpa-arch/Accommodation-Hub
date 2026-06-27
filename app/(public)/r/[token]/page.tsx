import { notFound } from 'next/navigation'
import { Home } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import PublicTriageChat from '@/components/maintenance/PublicTriageChat'

export const dynamic = 'force-dynamic'

interface PropertyLookup {
  id: string
  unit_number: string | null
  is_active: boolean | null
  buildings: { name: string | null } | null
  companies: { name: string | null; email: string | null; phone: string | null } | null
}

export default async function PublicTriagePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  if (!process.env.TRIAGE_AGENT_ENABLED) notFound()

  const { token } = await params

  let property: PropertyLookup | null = null
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('properties')
      .select('id, unit_number, is_active, buildings(name), companies(name, email, phone)')
      .eq('triage_token', token)
      .maybeSingle()
    if (error) console.error('[r/token] property lookup failed:', error.message)
    property = (data as unknown as PropertyLookup) ?? null
  } catch {
    // Missing service-role env etc. — treat as not found rather than leak details.
    property = null
  }

  if (!property || property.is_active === false) notFound()

  const company = property.companies
  const locationLabel = [property.buildings?.name, property.unit_number].filter(Boolean).join(' · ')

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600">
          <Home className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Report a maintenance issue</h1>
          {(company?.name || locationLabel) && (
            <p className="text-[13px] text-slate-500">
              {company?.name}{company?.name && locationLabel ? ' — ' : ''}{locationLabel}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-4 text-[13px] text-slate-500">
          Tell us what's wrong and we'll guide you through a few quick questions. If it's an
          emergency (gas, fire, flooding, electric shock), we'll show you what to do straight away.
        </p>
        <div className="h-[560px]">
          <PublicTriageChat
            token={token}
            contactEmail={company?.email}
            contactPhone={company?.phone}
          />
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] text-slate-400">
        Powered by AccomHub · Do not enter banking or payment details here.
      </p>
    </div>
  )
}
