// Minimal transactional email sender via Resend's HTTP API (no SDK dependency).
// Gracefully degrades: if RESEND_API_KEY / EMAIL_FROM aren't set, returns
// { sent: false, reason: 'not_configured' } so callers can fall back to showing
// the link for manual sending instead of failing.

interface SendArgs {
  to: string
  subject: string
  html: string
}

export interface SendResult {
  sent: boolean
  reason?: string
}

export async function sendEmail({ to, subject, html }: SendArgs): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!key || !from) return { sent: false, reason: 'not_configured' }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[email] resend failed', res.status, body.slice(0, 300))
      return { sent: false, reason: `http_${res.status}` }
    }
    return { sent: true }
  } catch (err) {
    console.error('[email] send error', err instanceof Error ? err.message : String(err))
    return { sent: false, reason: 'exception' }
  }
}
