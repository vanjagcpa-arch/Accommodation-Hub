import { NextResponse } from 'next/server'

const mockAccounts = [
  { id: 'e1', tenant: 'Wei Zhang', property: 'Unit 101', building: 'Parkview Apts', status: 'active', tenant_code: 'EZ-10001', provider: 'Energy Australia', move_in_date: '2026-01-15', consent_given: true },
  { id: 'e2', tenant: 'Priya Sharma', property: 'Unit 1A', building: 'University Gardens', status: 'active', tenant_code: 'EZ-10002', provider: 'Energy Australia', move_in_date: '2026-02-01', consent_given: true },
  { id: 'e3', tenant: 'Carlos Rodriguez', property: 'Unit 501', building: 'Monash Towers', status: 'pending_consent', tenant_code: null, provider: null, move_in_date: '2026-03-01', consent_given: false },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const format = searchParams.get('format')

  let filtered = mockAccounts
  if (status) filtered = filtered.filter(a => a.status === status)

  // Ezidebit CSV export
  if (format === 'ezidebit_csv') {
    const active = mockAccounts.filter(a => a.status === 'active' && a.tenant_code)
    const csvRows = [
      ['TenantCode', 'TenantName', 'Property', 'Building', 'Provider', 'MoveInDate'].join(','),
      ...active.map(a => [a.tenant_code, a.tenant, a.property, a.building, a.provider ?? '', a.move_in_date ?? ''].join(',')),
    ]
    const csv = csvRows.join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="ezidebit-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  }

  // TODO: Replace with Supabase query:
  // const supabase = await createClient()
  // const { data, error } = await supabase.from('electricity_accounts').select('*, properties(unit_number, buildings(name)), tenants(first_name, last_name)')

  return NextResponse.json({ data: filtered, total: filtered.length })
}
