import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const supabase = await createClient()
    let query = supabase
      .from('applications')
      .select(
        'id, applicant_first_name, applicant_last_name, applicant_email, status, preferred_move_in, building_id, property_id, created_at'
      )
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)

    const { data, error } = await query.limit(200)
    if (error) {
      console.error('[api/applications GET]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data: data ?? [], total: data?.length ?? 0 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load applications'
    console.error('[api/applications GET]', msg)
    return NextResponse.json({ error: msg }, { status: 503 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { data, error } = await supabase
      .from('applications')
      .insert({ ...body, status: body.status ?? 'new' })
      .select()
      .single()

    if (error) {
      console.error('[api/applications POST]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create application'
    console.error('[api/applications POST]', msg)
    return NextResponse.json({ error: msg }, { status: 503 })
  }
}
