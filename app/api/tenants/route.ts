import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const supabase = await createClient()
    let query = supabase
      .from('tenants')
      .select('id, first_name, last_name, email, phone, university, is_active')
      .eq('is_active', true)
      .order('last_name')

    if (search) {
      const term = search.replace(/[%,]/g, ' ').trim()
      if (term) {
        query = query.or(
          `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`
        )
      }
    }

    const { data, error } = await query.limit(200)
    if (error) {
      console.error('[api/tenants GET]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data: data ?? [], total: data?.length ?? 0 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load tenants'
    console.error('[api/tenants GET]', msg)
    return NextResponse.json({ error: msg }, { status: 503 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { data, error } = await supabase
      .from('tenants')
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('[api/tenants POST]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create tenant'
    console.error('[api/tenants POST]', msg)
    return NextResponse.json({ error: msg }, { status: 503 })
  }
}
