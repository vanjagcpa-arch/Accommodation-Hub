import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 30

// Owner approve/decline endpoint. No login — the per-job owner_approval_token
// from the email link is the credential. Service-role client (the owner has no
// session). Idempotent: only a still-pending request can be decided.
interface Body {
  token?: string
  decision?: 'approved' | 'declined'
  note?: string
}

export async function POST(request: Request) {
  let body: Body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const token = (body.token ?? '').trim()
  const decision = body.decision
  if (!token || (decision !== 'approved' && decision !== 'declined')) {
    return NextResponse.json({ error: 'Missing token or decision.' }, { status: 400 })
  }

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 })
  }

  const { data: job } = await admin
    .from('maintenance_jobs')
    .select('id, company_id, owner_approval_status')
    .eq('owner_approval_token', token)
    .maybeSingle()

  if (!job) return NextResponse.json({ error: 'This link is not valid.' }, { status: 404 })
  if (job.owner_approval_status !== 'pending') {
    return NextResponse.json({ error: 'already_decided', status: job.owner_approval_status }, { status: 409 })
  }

  const { error } = await admin
    .from('maintenance_jobs')
    .update({
      owner_approval_status: decision,
      owner_approval_decided_at: new Date().toISOString(),
      owner_approval_note: (body.note ?? '').trim() || null,
      status: decision === 'approved' ? 'new' : 'cancelled',
    })
    .eq('id', job.id)
    .eq('owner_approval_status', 'pending') // guard against double-submit

  if (error) {
    console.error('[api/public/approve]', error.message)
    return NextResponse.json({ error: 'Could not record your response.' }, { status: 500 })
  }

  // Audit (non-fatal; owner is not an app user, so user_id is null).
  await admin.from('audit_logs').insert({
    company_id: job.company_id,
    user_id: null,
    action: 'status_changed',
    entity_type: 'maintenance_job',
    entity_id: job.id,
    description: `Owner ${decision} via email link`,
  })

  return NextResponse.json({ ok: true, decision })
}
