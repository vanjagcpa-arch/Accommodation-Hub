import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runTriageAgent } from '@/lib/ai/triage/agent'

export const maxDuration = 60

// Public, unauthenticated tenant intake. A property's hard-to-guess
// `triage_token` (from the QR / link) stands in for a login. All DB writes go
// through the service-role client because tenants have no Supabase session and
// RLS forbids client-side inserts into the intake tables. We never trust the
// browser for company/property identity — both are resolved from the token.

interface RequestBody {
  token?: string
  threadId?: string
  message: string | { imageBase64: string; mediaType: string }
}

// Best-effort in-memory limiter (per warm instance) — first line of defence.
const WINDOW_MS = 60 * 60 * 1000
const PER_TOKEN_PER_HOUR = 20
const tokenHits = new Map<string, number[]>()

function tooManyForToken(token: string): boolean {
  const now = Date.now()
  const hits = (tokenHits.get(token) ?? []).filter((t) => now - t < WINDOW_MS)
  hits.push(now)
  tokenHits.set(token, hits)
  return hits.length > PER_TOKEN_PER_HOUR
}

export async function POST(request: Request) {
  if (!process.env.TRIAGE_AGENT_ENABLED) {
    return NextResponse.json({ error: 'Triage is not enabled.' }, { status: 404 })
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 })
  }

  let body: RequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const token = (body.token ?? '').trim()
  if (!token || !body.message) {
    return NextResponse.json({ error: 'Missing token or message.' }, { status: 400 })
  }

  if (tooManyForToken(token)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later or contact your property manager.' },
      { status: 429 }
    )
  }

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 })
  }

  // Resolve property + company from the token (server-trusted identity).
  const { data: property } = await admin
    .from('properties')
    .select('id, company_id, building_id, is_active')
    .eq('triage_token', token)
    .maybeSingle()

  if (!property || property.is_active === false) {
    return NextResponse.json({ error: 'This link is not valid.' }, { status: 404 })
  }

  // Cross-instance hard cap: throttle runaway intake per company.
  const sinceIso = new Date(Date.now() - WINDOW_MS).toISOString()
  const { count } = await admin
    .from('maintenance_intake_threads')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', property.company_id)
    .eq('source', 'qr')
    .gte('created_at', sinceIso)

  if ((count ?? 0) > 200) {
    return NextResponse.json({ error: 'Service is busy. Please try again later.' }, { status: 429 })
  }

  try {
    const result = await runTriageAgent(admin, {
      threadId: body.threadId,
      message: body.message,
      companyId: property.company_id,
      propertyId: property.id,
      buildingId: property.building_id ?? null,
      source: 'qr',
    })

    const { turn, threadId, jobId } = result
    return NextResponse.json({ turn, threadId, jobId })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[api/public/triage]', msg)
    return NextResponse.json({ error: 'Sorry, something went wrong. Please try again.' }, { status: 500 })
  }
}
