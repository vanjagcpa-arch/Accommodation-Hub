export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'

export default async function ElectricityTenantsPage() {
  const supabase = await createClient()

  const { data: buildings } = await supabase
    .from('buildings')
    .select('id')
    .eq('manages_electricity', true)

  const buildingIds = (buildings ?? []).map((b: { id: string }) => b.id)

  let occupancies: {
    id: string
    lease_start: string | null
    lease_end: string | null
    tenant: { id: string; full_name: string; email: string | null; phone: string | null } | null
    property: {
      id: string
      unit_number: string
      building: { id: string; name: string } | null
    } | null
  }[] = []

  if (buildingIds.length > 0) {
    const { data } = await supabase
      .from('occupancies')
      .select(`
        id,
        lease_start,
        lease_end,
        tenant:tenants(id, full_name, email, phone),
        property:properties(
          id,
          unit_number,
          building:buildings(id, name)
        )
      `)
      .eq('is_current', true)
      .in('property.building_id', buildingIds)
      .order('lease_end', { ascending: true })

    occupancies = ((data ?? []) as unknown as typeof occupancies).filter(
      (o): o is typeof occupancies[number] => o.property !== null
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-line bg-surface px-6 py-4">
        <h1 className="text-lg font-semibold text-ink">Electricity Tenants</h1>
        <p className="text-sm text-ink-muted">
          {occupancies.length} active tenants in electricity-managed buildings
        </p>
      </div>

      <div className="p-6">
        {occupancies.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface p-12 text-center">
            <p className="text-sm text-ink-muted">No active tenants in electricity-managed buildings.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-line bg-surface overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-canvas border-b border-line">
                <tr>
                  {['Tenant', 'Contact', 'Property', 'Building', 'Lease Start', 'Lease End'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {occupancies.map(o => (
                  <tr key={o.id} className="hover:bg-canvas/50">
                    <td className="px-4 py-3 font-medium text-ink">{o.tenant?.full_name ?? '—'}</td>
                    <td className="px-4 py-3 text-ink-muted">
                      <div>{o.tenant?.email ?? '—'}</div>
                      <div className="text-xs">{o.tenant?.phone ?? ''}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">Unit {o.property?.unit_number}</td>
                    <td className="px-4 py-3 text-ink-muted">{o.property?.building?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-ink-muted">{o.lease_start ?? '—'}</td>
                    <td className="px-4 py-3 text-ink-muted">{o.lease_end ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
