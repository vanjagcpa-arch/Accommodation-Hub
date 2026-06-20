import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const buildingId = searchParams.get('building_id')

    const supabase = await createClient()
    let query = supabase
      .from('properties')
      .select('id, unit_number, building_id, property_type, bedrooms, bathrooms, rent_amount, status, available_date')
      .eq('is_active', true)
      .order('unit_number')

    if (status) query = query.eq('status', status)
    if (buildingId) query = query.eq('building_id', buildingId)

    const { data, error } = await query.limit(500)
    if (error) {
      console.error('[api/properties GET]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data: data ?? [], total: data?.length ?? 0 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load properties'
    console.error('[api/properties GET]', msg)
    return NextResponse.json({ error: msg }, { status: 503 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { data, error } = await supabase
      .from('properties')
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('[api/properties POST]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create property'
    console.error('[api/properties POST]', msg)
    return NextResponse.json({ error: msg }, { status: 503 })
  }
}
