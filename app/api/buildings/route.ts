import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('buildings')
      .select('id, name, address, suburb, total_properties, is_active, manages_electricity, manages_maintenance')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('[api/buildings GET]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data: data ?? [], total: data?.length ?? 0 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load buildings'
    console.error('[api/buildings GET]', msg)
    return NextResponse.json({ error: msg }, { status: 503 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { data, error } = await supabase
      .from('buildings')
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('[api/buildings POST]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create building'
    console.error('[api/buildings POST]', msg)
    return NextResponse.json({ error: msg }, { status: 503 })
  }
}
