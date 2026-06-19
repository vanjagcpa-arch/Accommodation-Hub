import { NextResponse } from 'next/server'

export async function POST() {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    await supabase.auth.signOut()
  }

  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000'

  return NextResponse.redirect(new URL('/login', base), { status: 303 })
}
