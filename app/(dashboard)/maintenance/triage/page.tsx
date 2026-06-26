export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import TenantLinksClient, { type PropertyRow } from './_components/tenant-links-client'

const MANAGER_ROLES = ['super_admin', 'admin', 'internal_manager']

async function getData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { rows: [], canManage: false }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.company_id) return { rows: [], canManage: false }

  const { data: properties } = await supabase
    .from('properties')
    .select('id, unit_number, triage_token, is_active, buildings(name)')
    .eq('company_id', profile.company_id)
    .eq('is_active', true)
    .order('unit_number', { ascending: true })

  const rows: PropertyRow[] = (properties ?? []).map((p) => ({
    id: p.id,
    unitNumber: p.unit_number,
    buildingName: (p.buildings as unknown as { name: string | null } | null)?.name ?? null,
    token: p.triage_token ?? null,
  }))

  return { rows, canManage: MANAGER_ROLES.includes(profile.role ?? '') }
}

export default async function TenantTriageLinksPage() {
  const { rows, canManage } = await getData()
  const enabled = !!process.env.TRIAGE_AGENT_ENABLED

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Tenant Triage Links</h1>
        <p className="text-[13px] text-ink-muted mt-1">
          Share a per-property link or QR code so tenants can report maintenance issues. Each
          conversation is triaged by the agent and lands as a job in Work Orders.
        </p>
      </div>

      {!enabled && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          The triage agent is currently <strong>disabled</strong>. Links will not work until
          <code className="mx-1 rounded bg-amber-100 px-1">TRIAGE_AGENT_ENABLED</code> and
          <code className="mx-1 rounded bg-amber-100 px-1">OPENAI_API_KEY</code> are set in the environment.
        </div>
      )}

      <TenantLinksClient rows={rows} canManage={canManage} />
    </div>
  )
}
