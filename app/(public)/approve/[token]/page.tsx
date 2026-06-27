import { notFound } from 'next/navigation'
import { Home, CheckCircle2, XCircle } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import OwnerApprovalClient from '@/components/maintenance/OwnerApprovalClient'

export const dynamic = 'force-dynamic'

interface JobLookup {
  id: string
  title: string
  description: string | null
  estimated_cost: number | null
  owner_approval_status: string | null
  owner_approval_decided_at: string | null
  property: { unit_number: string | null } | null
  building: { name: string | null } | null
  companies: { name: string | null } | null
}

export default async function OwnerApprovePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  let job: JobLookup | null = null
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('maintenance_jobs')
      .select('id, title, description, estimated_cost, owner_approval_status, owner_approval_decided_at, property:properties(unit_number), building:buildings(name), companies(name)')
      .eq('owner_approval_token', token)
      .maybeSingle()
    if (error) console.error('[approve/token] lookup failed:', error.message)
    job = (data as unknown as JobLookup) ?? null
  } catch {
    job = null
  }

  if (!job) notFound()

  const locationLabel = [job.building?.name, job.property?.unit_number && `Unit ${job.property.unit_number}`]
    .filter(Boolean)
    .join(' · ')
  const company = job.companies?.name
  const decided = job.owner_approval_status === 'approved' || job.owner_approval_status === 'declined'
  const decidedDate = job.owner_approval_decided_at
    ? new Date(job.owner_approval_decided_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600">
          <Home className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Maintenance approval</h1>
          {company && <p className="text-[13px] text-slate-500">{company}</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {locationLabel && <p className="text-[13px] text-slate-500">{locationLabel}</p>}
        <h2 className="mt-1 text-base font-semibold text-slate-900">{job.title}</h2>
        {job.description && <p className="mt-2 text-[13px] text-slate-600 whitespace-pre-line">{job.description}</p>}
        {job.estimated_cost != null && (
          <p className="mt-3 text-[13px] text-slate-700">Estimated cost: <strong>${job.estimated_cost.toFixed(2)}</strong></p>
        )}

        <div className="mt-6">
          {decided ? (
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-[14px] ${job.owner_approval_status === 'approved' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
              {job.owner_approval_status === 'approved' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              You {job.owner_approval_status} this request{decidedDate ? ` on ${decidedDate}` : ''}. Thank you.
            </div>
          ) : (
            <OwnerApprovalClient token={token} />
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] text-slate-400">
        Powered by AccomHub · Do not enter banking or payment details here.
      </p>
    </div>
  )
}
