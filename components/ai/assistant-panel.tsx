'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Send, Sparkles, Trash2, Copy, Check, Database, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  dataUsed?: string[]
  usingMockData?: boolean
  error?: string
  id: string
}

interface AssistantContext {
  page?: string
  propertyCode?: string
  propertyId?: string
  applicantId?: string
  tenantId?: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  context?: AssistantContext
  suggestedPrompts?: string[]
}

const DEFAULT_PROMPTS = [
  'What needs attention today?',
  'Which vacancies should we prioritise?',
  'Which applications need review?',
  'Which maintenance jobs are blocking leasing?',
  'Which electricity accounts are overdue?',
  'Summarise open maintenance jobs',
]

const PROPERTY_PROMPTS = [
  'Summarise this property',
  'What needs attention?',
  'Recommend next action',
  'Show open maintenance jobs',
  'Explain billing status',
  'Who is the current tenant?',
]

function DataUsedPanel({ dataUsed, usingMockData }: { dataUsed: string[]; usingMockData?: boolean }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="mt-2 rounded-lg border border-line bg-surface-muted text-[11px]">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-ink-subtle hover:text-ink-muted"
      >
        <Database className="h-3 w-3 shrink-0" />
        <span className="font-medium">Data used</span>
        {usingMockData && (
          <span className="ml-1 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-semibold text-amber-700">MOCK</span>
        )}
        {expanded ? <ChevronUp className="ml-auto h-3 w-3" /> : <ChevronDown className="ml-auto h-3 w-3" />}
      </button>
      {expanded && (
        <ul className="border-t border-line px-2.5 py-1.5 space-y-0.5">
          {dataUsed.map((d) => (
            <li key={d} className="flex items-center gap-1 text-ink-muted">
              <span className="h-1 w-1 rounded-full bg-ink-faint shrink-0" />
              {d}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AssistantMessage({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (msg.error) {
    return (
      <div className="flex gap-2.5">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neg/10 mt-0.5">
          <AlertTriangle className="h-3.5 w-3.5 text-neg" />
        </div>
        <div className="flex-1 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-[13px] text-red-700">
          {msg.error}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2.5 group">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft mt-0.5">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="prose prose-sm max-w-none">
          <div
            className="text-[13px] text-ink leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
          />
        </div>
        {msg.dataUsed && msg.dataUsed.length > 0 && (
          <DataUsedPanel dataUsed={msg.dataUsed} usingMockData={msg.usingMockData} />
        )}
        <button
          onClick={copy}
          className="mt-1.5 flex items-center gap-1 text-[11px] text-ink-faint hover:text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

function formatMarkdown(text: string): string {
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>')
  text = text.replace(/^### (.+)$/gm, '<h4 class="text-[13px] font-semibold text-ink mt-3 mb-1">$1</h4>')
  text = text.replace(/^## (.+)$/gm, '<h3 class="text-[13px] font-semibold text-ink mt-3 mb-1">$1</h3>')
  text = text.replace(/^[-•] (.+)$/gm, '<li class="text-[13px] text-ink-muted ml-3 list-disc">$1</li>')
  text = text.replace(/^\d+\. (.+)$/gm, '<li class="text-[13px] text-ink-muted ml-3 list-decimal">$1</li>')
  text = text.replace(/`(.+?)`/g, '<code class="text-[12px] bg-surface-muted px-1 rounded font-mono text-ink-muted">$1</code>')
  text = text.replace(/^---$/gm, '<hr class="border-line my-2" />')
  return text
}

export default function AssistantPanel({ isOpen, onClose, context, suggestedPrompts }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const prompts = suggestedPrompts ?? (context?.propertyCode ? PROPERTY_PROMPTS : DEFAULT_PROMPTS)

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      const userMsg: Message = { role: 'user', content: trimmed, id: crypto.randomUUID() }
      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setLoading(true)

      try {
        const history = [...messages, userMsg]
          .slice(-10)
          .map(({ role, content }) => ({ role, content }))

        const res = await fetch('/api/ai/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, context, history }),
        })

        const data = await res.json()

        if (!res.ok) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: '',
              error: data.error ?? `Error ${res.status}`,
              id: crypto.randomUUID(),
            },
          ])
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: data.answer,
              dataUsed: data.dataUsed,
              usingMockData: data.usingMockData,
              id: crypto.randomUUID(),
            },
          ])
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: '',
            error: 'Could not reach the assistant. Check your connection.',
            id: crypto.randomUUID(),
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [messages, context, loading]
  )

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-surface shadow-2xl sm:w-[420px] sm:border-l sm:border-line">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-ink">AI Assistant</p>
            {context?.propertyCode && (
              <p className="text-[11px] text-ink-muted">Property: {context.propertyCode}</p>
            )}
            {context?.page && !context.propertyCode && (
              <p className="text-[11px] text-ink-muted">{context.page}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="rounded-md p-1.5 text-ink-subtle hover:bg-canvas hover:text-ink-muted"
              title="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-ink-subtle hover:bg-canvas hover:text-ink-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mock data notice */}
      <div className="flex items-center gap-2 border-b border-line bg-amber-50 px-4 py-2">
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 shrink-0">MOCK DATA</span>
        <p className="text-[11px] text-amber-700">Using demo data — connect live integrations to use real records.</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Operations Assistant</p>
              <p className="text-[12px] text-ink-muted mt-1 max-w-[260px]">
                Ask about properties, tenants, applications, maintenance, or billing.
              </p>
            </div>
            <div className="w-full space-y-1.5 mt-2">
              <p className="text-[11px] font-medium text-ink-subtle uppercase tracking-wider">Try asking</p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {prompts.slice(0, 4).map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="rounded-full border border-line bg-canvas px-3 py-1 text-[12px] text-ink-muted hover:border-primary/40 hover:text-primary hover:bg-primary-softer transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-[13px] text-white">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <AssistantMessage msg={msg} />
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft mt-0.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex items-center gap-1 pt-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-ink-faint animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts (when there are messages) */}
      {messages.length > 0 && !loading && (
        <div className="border-t border-line px-4 py-2">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-thin pb-0.5">
            {prompts.slice(0, 5).map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="shrink-0 rounded-full border border-line bg-canvas px-2.5 py-1 text-[11px] text-ink-muted hover:border-primary/40 hover:text-primary hover:bg-primary-softer transition-colors whitespace-nowrap"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-line p-4">
        <div className="flex items-end gap-2 rounded-xl border border-line bg-canvas px-3 py-2 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your portfolio…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-[13px] text-ink placeholder:text-ink-subtle focus:outline-none max-h-28"
            style={{ minHeight: '22px' }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className={cn(
              'shrink-0 flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
              input.trim() && !loading
                ? 'bg-primary text-white hover:bg-primary-hover'
                : 'bg-surface-muted text-ink-faint cursor-not-allowed'
            )}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-ink-faint text-center">
          Read-only · AI may make mistakes · Always verify before acting
        </p>
      </div>
    </div>
  )
}
