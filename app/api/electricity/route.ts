import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const format = searchParams.get('format')

    const supabase = await createClient()
    let query = supabase
      .from('electricity_accounts')
      .select(`
        id, status, tenant_code, provider, account_number, move_in_date, move_out_date, consent_given,
        property:properties(id, unit_number, building:buildings(id, name)),
        tenant:tenants(id, first_name, last_name, email)
      `)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)

    const { data, error } = await query.limit(500)
    if (error) {
      console.error('[api/electricity GET]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const accounts = data ?? []

    if (format === 'ezidebit_csv') {
      const active = accounts.filter(
        (a) => a.status === 'active' && a.tenant_code
      )
      const csvRows = [
        ['TenantCode', 'TenantName', 'Property', 'Building', 'Provider', 'MoveInDate'].join(','),
        ...active.map((a) => {
          const t = a.tenant as unknown as { first_name: string; last_name: string } | null
          const p = a.property as unknown as { unit_number: string; building: { name: string } | null } | null
          return [
            a.tenant_code,
            t ? `${t.first_name} ${t.last_name}` : '',
            p?.unit_number ?? '',
            p?.building?.name ?? '',
            a.provider ?? '',
            a.move_in_date ?? '',
          ].join(',')
        }),
      ]
      return new NextResponse(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="ezidebit-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    return NextResponse.json({ data: accounts, total: accounts.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load electricity accounts'
    console.error('[api/electricity GET]', msg)
    return NextResponse.json({ error: msg }, { status: 503 })
  }
}
