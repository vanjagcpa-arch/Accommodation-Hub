import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OPEN_STATUSES } from '@/lib/maintenance/constants'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')

    const supabase = await createClient()
    let query = supabase
      .from('maintenance_jobs')
      .select(`
        id, job_number, title, status, priority, due_date, building_id, property_id,
        building:buildings(name),
        property:properties(unit_number)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    else query = query.in('status', OPEN_STATUSES)
    if (priority) query = query.eq('priority', priority)

    const { data, error } = await query.limit(200)
    if (error) {
      console.error('[api/maintenance GET]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data: data ?? [], total: data?.length ?? 0 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load maintenance jobs'
    console.error('[api/maintenance GET]', msg)
    return NextResponse.json({ error: msg }, { status: 503 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { data, error } = await supabase
      .from('maintenance_jobs')
      .insert({ ...body, status: body.status ?? 'new' })
      .select()
      .single()

    if (error) {
      console.error('[api/maintenance POST]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create maintenance job'
    console.error('[api/maintenance POST]', msg)
    return NextResponse.json({ error: msg }, { status: 503 })
  }
}
