import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const env = {
    NEXT_PUBLIC_SUPABASE_URL: url ? 'set' : 'missing',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: key ? 'set' : 'missing',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'set' : 'missing',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? 'set' : 'missing',
  }

  let db = 'not_checked'
  if (url && key) {
    try {
      // Use the anon key without cookie management — we only need connectivity.
      const supabase = createServerClient(url, key, {
        cookies: { getAll: () => [], setAll: () => {} },
      })
      const t0 = Date.now()
      const { error } = await supabase.from('buildings').select('id').limit(1)
      // An empty result is fine (RLS may block rows); a real error means DB issue.
      db = error ? `error: ${error.message}` : `ok (${Date.now() - t0}ms)`
    } catch (e) {
      db = `exception: ${e instanceof Error ? e.message : String(e)}`
    }
  } else {
    db = 'not_checked: env vars missing'
  }

  const ok =
    env.NEXT_PUBLIC_SUPABASE_URL === 'set' &&
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'set' &&
    db.startsWith('ok')

  return NextResponse.json(
    { status: ok ? 'ok' : 'degraded', env, db },
    { status: ok ? 200 : 503 }
  )
}
