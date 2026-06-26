import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runTriageAgent } from '@/lib/ai/triage/agent'

export const maxDuration = 60

interface RequestBody {
  threadId?: string
  message: string | { imageBase64: string; mediaType: string }
  occupancyId?: string
  tenantId?: string
  source?: string
}

export async function POST(request: Request) {
  if (!process.env.TRIAGE_AGENT_ENABLED) {
    return NextResponse.json({ error: 'Triage agent is not enabled.' }, { status: 404 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured.', hint: 'Add OPENAI_API_KEY to environment variables.' },
      { status: 503 }
    )
  }

  let supabase: Awaited<ReturnType<typeof createClient>>
  try {
    supabase = await createClient()
  } catch {
    return NextResponse.json({ error: 'Database connection unavailable.' }, { status: 503 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) {
    return NextResponse.json({ error: 'No company associated with this user.' }, { status: 403 })
  }

  let body: RequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!body.message) {
    return NextResponse.json({ error: 'message is required.' }, { status: 400 })
  }

  try {
    const result = await runTriageAgent(supabase, {
      threadId: body.threadId,
      message: body.message,
      companyId: profile.company_id,
      occupancyId: body.occupancyId,
      tenantId: body.tenantId,
      source: body.source ?? 'web',
    })

    // Strip internal note before returning to client
    const { turn, threadId, jobId } = result
    return NextResponse.json({ turn, threadId, jobId })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[api/maintenance/triage]', msg)
    return NextResponse.json({ error: `Triage agent error: ${msg}` }, { status: 500 })
  }
}
