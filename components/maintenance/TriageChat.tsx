'use client'

import { useState, useRef, useCallback } from 'react'
import type { TriageTurn, QuestionTurn } from '@/lib/ai/triage/contract'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'tenant' | 'agent'
  text?: string
  question?: QuestionTurn
  steps?: string[]
  jobId?: string
}

interface LiveJob {
  category: string | null
  confidence: number
  priority: string | null
  sla_hours: number | null
  slots: Record<string, unknown>
}

interface Props {
  occupancyId?: string
  tenantId?: string
  source?: string
  // Defaults to the authenticated staff endpoint. The public tenant page passes
  // the token-based endpoint plus its property `token`.
  endpoint?: string
  token?: string
  onJobCreated?: (jobId: string) => void
  onHandoff?: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TriageChat({ occupancyId, tenantId, source = 'web', endpoint = '/api/maintenance/triage', token, onJobCreated, onHandoff }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'agent', text: 'Hi! What maintenance issue can we help you with today?' },
  ])
  const [threadId, setThreadId] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [liveJob, setLiveJob] = useState<LiveJob | null>(null)
  const [done, setDone] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [activeSlot, setActiveSlot] = useState<QuestionTurn | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const postMessage = useCallback(async (message: string | { imageBase64: string; mediaType: string }) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, message, occupancyId, tenantId, source, token }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        return
      }
      if (data.threadId) setThreadId(data.threadId)

      const turn: TriageTurn = data.turn
      handleTurn(turn, data.jobId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error.')
    } finally {
      setLoading(false)
    }
  }, [threadId, occupancyId, tenantId, source, endpoint, token])

  function handleTurn(turn: TriageTurn, jobId?: string) {
    // Update live job panel
    if (turn.category || turn.confidence > 0) {
      setLiveJob((prev) => ({
        category: turn.category ?? prev?.category ?? null,
        confidence: turn.confidence,
        priority: turn.job?.priority ?? prev?.priority ?? null,
        sla_hours: turn.job?.sla_hours ?? prev?.sla_hours ?? null,
        slots: turn.job?.slots ?? prev?.slots ?? {},
      }))
    }

    if (turn.action === 'emergency') {
      const steps = turn.self_help?.steps ?? []
      setMessages((m) => [...m, { role: 'agent', text: turn.self_help?.title, steps }])
      setDone(true)
    } else if (turn.action === 'self_help' && turn.self_help) {
      setMessages((m) => [...m, { role: 'agent', text: turn.self_help!.title, steps: turn.self_help!.steps }])
      setDone(true)
    } else if (turn.action === 'finalize' && jobId) {
      setMessages((m) => [...m, { role: 'agent', text: `Your request has been logged. A team member will be in touch.`, jobId }])
      setDone(true)
      onJobCreated?.(jobId)
    } else if (turn.action === 'ask' && turn.question) {
      setActiveSlot(turn.question)
      setMessages((m) => [...m, { role: 'agent', question: turn.question }])
    }
  }

  function sendText() {
    const txt = textInput.trim()
    if (!txt) return
    setMessages((m) => [...m, { role: 'tenant', text: txt }])
    setTextInput('')
    setActiveSlot(null)
    postMessage(txt)
  }

  function sendChip(value: string) {
    setMessages((m) => [...m, { role: 'tenant', text: value }])
    setActiveSlot(null)
    postMessage(value)
  }

  function sendToggle(value: boolean) {
    const label = value ? 'Yes' : 'No'
    setMessages((m) => [...m, { role: 'tenant', text: label }])
    setActiveSlot(null)
    postMessage(label)
  }

  async function sendPhoto() {
    if (!photoFile) return
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      setMessages((m) => [...m, { role: 'tenant', text: '📷 Photo uploaded' }])
      setPhotoFile(null)
      setActiveSlot(null)
      await postMessage({ imageBase64: base64, mediaType: photoFile.type })
    }
    reader.readAsDataURL(photoFile)
  }

  function skipPhoto() {
    setMessages((m) => [...m, { role: 'tenant', text: '(Photo skipped)' }])
    setPhotoFile(null)
    setActiveSlot(null)
    postMessage('skip')
  }

  const lastQuestion = activeSlot
  const isPhotoSlot = lastQuestion?.input === 'photo'
  const isToggleSlot = lastQuestion?.input === 'toggle'
  const isChipsSlot = lastQuestion?.input === 'chips' || lastQuestion?.input === 'dropdown'
  const isTextSlot = lastQuestion?.input === 'text'
  const showDropdown = lastQuestion?.input === 'dropdown' || (lastQuestion?.options && lastQuestion.options.length > 6)

  return (
    <div className="flex flex-col h-full gap-4 max-w-2xl mx-auto">
      {/* Live job panel */}
      {liveJob && (
        <div className="rounded-xl border border-line bg-surface px-4 py-3 text-[13px] space-y-1">
          <p className="font-semibold text-ink">Live job record</p>
          <div className="flex flex-wrap gap-3 text-ink-muted">
            {liveJob.category && <span>Category: <strong className="text-ink">{liveJob.category}</strong></span>}
            <span>Confidence: <strong className="text-ink">{Math.round(liveJob.confidence * 100)}%</strong></span>
            {liveJob.priority && <span>Priority: <strong className="text-ink">{liveJob.priority}</strong></span>}
            {liveJob.sla_hours && <span>SLA: <strong className="text-ink">{liveJob.sla_hours}h</strong></span>}
          </div>
          {Object.keys(liveJob.slots).length > 0 && (
            <div className="text-[12px] text-ink-faint mt-1">
              {Object.entries(liveJob.slots).map(([k, v]) => (
                <span key={k} className="mr-3">{k}: <span className="text-ink-muted">{String(v)}</span></span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'tenant' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-[13px] ${
              msg.role === 'tenant'
                ? 'bg-primary text-white'
                : 'bg-surface border border-line text-ink'
            }`}>
              {msg.text && <p>{msg.text}</p>}
              {msg.question && <p>{msg.question.text}</p>}
              {msg.steps && (
                <ol className="mt-2 space-y-1 list-decimal list-inside text-[12px]">
                  {msg.steps.map((step, j) => <li key={j}>{step}</li>)}
                </ol>
              )}
              {msg.jobId && (
                <p className="text-[11px] mt-1 opacity-75">Job ref: {msg.jobId.slice(0, 8)}</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-xl px-4 py-2.5 bg-surface border border-line text-ink-faint text-[13px] animate-pulse">
              Thinking…
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-[12px] text-neg px-1">{error}</p>
      )}

      {/* Input area */}
      {!done && (
        <div className="space-y-2">
          {/* Chips */}
          {isChipsSlot && lastQuestion?.options && !showDropdown && (
            <div className="flex flex-wrap gap-2">
              {lastQuestion.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => sendChip(opt)}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-full border border-line bg-surface text-[13px] text-ink hover:bg-surface-muted hover:border-primary transition-colors disabled:opacity-50"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* Dropdown (>6 options) */}
          {isChipsSlot && lastQuestion?.options && showDropdown && (
            <select
              className="w-full border border-line rounded-xl px-3 py-2 text-[13px] bg-surface text-ink"
              defaultValue=""
              onChange={(e) => { if (e.target.value) sendChip(e.target.value) }}
              disabled={loading}
            >
              <option value="" disabled>Select an option…</option>
              {lastQuestion.options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}

          {/* Toggle */}
          {isToggleSlot && (
            <div className="flex gap-3">
              <button
                onClick={() => sendToggle(true)}
                disabled={loading}
                className="flex-1 py-2 rounded-xl border-2 border-pos text-[13px] font-medium text-pos hover:bg-pos/5 disabled:opacity-50"
              >
                Yes
              </button>
              <button
                onClick={() => sendToggle(false)}
                disabled={loading}
                className="flex-1 py-2 rounded-xl border-2 border-line text-[13px] font-medium text-ink-muted hover:bg-surface-muted disabled:opacity-50"
              >
                No
              </button>
            </div>
          )}

          {/* Photo */}
          {isPhotoSlot && (
            <div className="flex gap-2 items-center">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              />
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={loading}
                className="px-4 py-2 rounded-xl border border-line bg-surface text-[13px] text-ink hover:bg-surface-muted disabled:opacity-50"
              >
                {photoFile ? `📷 ${photoFile.name}` : 'Upload photo'}
              </button>
              {photoFile && (
                <button
                  onClick={sendPhoto}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-[13px] font-medium disabled:opacity-50"
                >
                  Send
                </button>
              )}
              <button
                onClick={skipPhoto}
                disabled={loading}
                className="px-3 py-2 text-[13px] text-ink-muted hover:text-ink disabled:opacity-50"
              >
                Skip
              </button>
            </div>
          )}

          {/* Text + initial free-text */}
          {(isTextSlot || !lastQuestion) && (
            <div className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !loading) sendText() }}
                placeholder={lastQuestion?.text ?? 'Describe the issue…'}
                disabled={loading}
                className="flex-1 border border-line rounded-xl px-3 py-2 text-[13px] bg-canvas text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={sendText}
                disabled={loading || !textInput.trim()}
                className="px-4 py-2 rounded-xl bg-primary text-white text-[13px] font-medium disabled:opacity-50"
              >
                Send
              </button>
            </div>
          )}

          {/* Persistent escape */}
          <div className="flex justify-end">
            <button
              onClick={onHandoff}
              className="text-[12px] text-ink-faint hover:text-ink underline underline-offset-2"
            >
              Talk to a person instead
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
