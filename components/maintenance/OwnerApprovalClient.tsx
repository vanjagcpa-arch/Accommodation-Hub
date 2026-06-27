'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

// Owner-facing approve/decline buttons on the public /approve/<token> page.
export default function OwnerApprovalClient({ token }: { token: string }) {
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<'approved' | 'declined' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function decide(decision: 'approved' | 'declined') {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/public/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, decision, note }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'already_decided') {
          setResult(data.status === 'declined' ? 'declined' : 'approved')
          return
        }
        setError(data.error ?? 'Something went wrong.')
        return
      }
      setResult(decision)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-[14px] ${result === 'approved' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
        {result === 'approved' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
        {result === 'approved'
          ? 'Approved — thank you. Your managing agent will proceed.'
          : 'Declined — thank you. Your managing agent has been notified.'}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note (optional)…"
        rows={3}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-green-500"
      />
      {error && <p className="text-[13px] text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button
          onClick={() => decide('approved')}
          disabled={submitting}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-green-600 px-4 py-2.5 text-[14px] font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          <CheckCircle2 className="h-4 w-4" />Approve
        </button>
        <button
          onClick={() => decide('declined')}
          disabled={submitting}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-red-300 px-4 py-2.5 text-[14px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          <XCircle className="h-4 w-4" />Decline
        </button>
      </div>
    </div>
  )
}
