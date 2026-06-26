'use client'

import { useState, useTransition } from 'react'
import { Check, X, Plus, Pencil, Trash2, AlertTriangle, CircleCheck, CircleSlash } from 'lucide-react'
import * as actions from '../actions'
import type { SlotInput, KbInput } from '../actions'

// ── View models ───────────────────────────────────────────────────────────────
export interface SlotVM {
  id: string
  slot_key: string
  question: string
  input: string
  options: string[]
  sort_order: number
  conditional: boolean
  is_active: boolean
}
export interface CategoryVM {
  id: string
  slug: string
  name: string
  default_priority: string
  default_sla_hours: number
  triage_routing: string
  slots: SlotVM[]
}
export interface KbArticleVM {
  id: string
  category_id: string
  title: string
  symptoms: string[]
  steps: string[]
}
interface Status {
  enabled: boolean
  hasKey: boolean
  workhorse: string
  escalation: string
  emergencyKeywords: string[]
}

const PRIORITIES = ['urgent', 'high', 'medium', 'low']
const INPUTS = ['chips', 'dropdown', 'toggle', 'text', 'photo']
const lines = (v: string) => v.split('\n').map((s) => s.trim()).filter(Boolean)

const inputCls = 'w-full rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-[13px] text-ink focus:outline-none focus:ring-1 focus:ring-primary'
const btnCls = 'inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-ink hover:bg-surface-muted disabled:opacity-50'
const primaryBtn = 'inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-50'

// ════════════════════════════════════════════════════════════════════════════
export default function TriageSettingsClient({ categories, kb, status }: { categories: CategoryVM[]; kb: KbArticleVM[]; status: Status }) {
  const [tab, setTab] = useState<'status' | 'categories' | 'kb'>('status')

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-line">
        {([['status', 'Status'], ['categories', 'Categories & questions'], ['kb', 'Self-help answers']] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`-mb-px border-b-2 px-3 py-2 text-[13px] font-medium ${tab === k ? 'border-primary text-ink' : 'border-transparent text-ink-muted hover:text-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'status' && <StatusPanel status={status} />}
      {tab === 'categories' && (
        <div className="space-y-4">
          {categories.length === 0 && <Empty>No categories yet. Run migration 012 to seed the defaults.</Empty>}
          {categories.map((c) => <CategoryCard key={c.id} category={c} />)}
        </div>
      )}
      {tab === 'kb' && <KbPanel kb={kb} categories={categories} />}
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-[13px] text-ink-muted">{children}</p>
}

// ── Status ────────────────────────────────────────────────────────────────────
function StatusPanel({ status }: { status: Status }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <StatusRow ok={status.enabled} label="Agent enabled" detail={status.enabled ? 'TRIAGE_AGENT_ENABLED is set' : 'Set TRIAGE_AGENT_ENABLED to turn it on'} />
        <StatusRow ok={status.hasKey} label="OpenAI key" detail={status.hasKey ? 'OPENAI_API_KEY is set' : 'Set OPENAI_API_KEY (server-side only)'} />
      </div>
      <div className="rounded-xl border border-line bg-surface px-4 py-3 text-[13px]">
        <p className="font-medium text-ink">Models</p>
        <p className="text-ink-muted mt-1">Workhorse: <code className="rounded bg-surface-muted px-1">{status.workhorse}</code> · Escalation: <code className="rounded bg-surface-muted px-1">{status.escalation}</code></p>
        <p className="mt-1 text-[12px] text-ink-faint">Configure via TRIAGE_MODEL_WORKHORSE / TRIAGE_MODEL_ESCALATION env vars.</p>
      </div>
      <div className="rounded-xl border border-line bg-surface px-4 py-3 text-[13px]">
        <div className="flex items-center gap-2 font-medium text-ink"><AlertTriangle className="h-4 w-4 text-amber-500" />Emergency keywords ({status.emergencyKeywords.length})</div>
        <p className="mt-1 text-[12px] text-ink-faint">Scanned before any model call — managed in code (lib/maintenance/slot-config.ts) for safety.</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {status.emergencyKeywords.map((k) => <span key={k} className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800 border border-amber-200">{k}</span>)}
        </div>
      </div>
    </div>
  )
}
function StatusRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-[13px]">
      {ok ? <CircleCheck className="h-4 w-4 text-pos shrink-0 mt-0.5" /> : <CircleSlash className="h-4 w-4 text-neg shrink-0 mt-0.5" />}
      <div><p className="font-medium text-ink">{label}</p><p className="text-[12px] text-ink-muted">{detail}</p></div>
    </div>
  )
}

// ── Category card (editable fields + slots) ───────────────────────────────────
function CategoryCard({ category }: { category: CategoryVM }) {
  const [name, setName] = useState(category.name)
  const [priority, setPriority] = useState(category.default_priority)
  const [sla, setSla] = useState(String(category.default_sla_hours))
  const [routing, setRouting] = useState(category.triage_routing)
  const [err, setErr] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const [addingSlot, setAddingSlot] = useState(false)
  const [editSlotId, setEditSlotId] = useState<string | null>(null)

  const dirty = name !== category.name || priority !== category.default_priority || sla !== String(category.default_sla_hours) || routing !== category.triage_routing

  function save() {
    setErr(null)
    start(async () => {
      const res = await actions.updateCategory(category.id, { name, default_priority: priority, default_sla_hours: Number(sla), triage_routing: routing })
      if (res.error) setErr(res.error)
    })
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Name" className="min-w-[140px] flex-1"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Priority"><select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>{PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}</select></Field>
        <Field label="SLA (h)"><input type="number" min={0} className={`${inputCls} w-24`} value={sla} onChange={(e) => setSla(e.target.value)} /></Field>
        <Field label="Routing" className="min-w-[160px] flex-1"><input className={inputCls} value={routing} placeholder="e.g. internal_plumber" onChange={(e) => setRouting(e.target.value)} /></Field>
        <button onClick={save} disabled={!dirty || pending} className={primaryBtn}><Check className="h-3.5 w-3.5" />{pending ? 'Saving…' : 'Save'}</button>
      </div>
      <p className="mt-1 text-[11px] text-ink-faint">slug: <code>{category.slug}</code></p>
      {err && <p className="mt-1 text-[12px] text-neg">{err}</p>}

      <div className="mt-3 border-t border-line pt-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[12px] font-medium text-ink-muted">Questions ({category.slots.length})</p>
          <button onClick={() => { setAddingSlot(true); setEditSlotId(null) }} className={btnCls}><Plus className="h-3.5 w-3.5" />Add question</button>
        </div>

        {addingSlot && (
          <SlotForm
            categoryId={category.id}
            initial={{ slot_key: '', question: '', input: 'chips', options: [], sort_order: (category.slots.at(-1)?.sort_order ?? 0) + 10, conditional: false, is_active: true }}
            onClose={() => setAddingSlot(false)}
          />
        )}

        <div className="space-y-1.5">
          {category.slots.map((s) =>
            editSlotId === s.id ? (
              <SlotForm key={s.id} categoryId={category.id} slotId={s.id} initial={s} onClose={() => setEditSlotId(null)} />
            ) : (
              <SlotRow key={s.id} slot={s} onEdit={() => { setEditSlotId(s.id); setAddingSlot(false) }} />
            )
          )}
        </div>
      </div>
    </div>
  )
}

function SlotRow({ slot, onEdit }: { slot: SlotVM; onEdit: () => void }) {
  const [pending, start] = useTransition()
  const [err, setErr] = useState<string | null>(null)
  return (
    <div className="flex items-center gap-2 rounded-lg bg-surface-muted px-3 py-2 text-[12px]">
      <code className="text-ink">{slot.slot_key}</code>
      <span className="text-ink-faint">·</span>
      <span className="text-ink-muted">{slot.input}</span>
      {slot.conditional && <span className="rounded bg-amber-50 px-1 text-[11px] text-amber-700 border border-amber-200">conditional</span>}
      {!slot.is_active && <span className="rounded bg-surface px-1 text-[11px] text-ink-faint border border-line">inactive</span>}
      <span className="truncate text-ink-muted flex-1">{slot.question}</span>
      <button onClick={onEdit} className="text-ink-muted hover:text-ink"><Pencil className="h-3.5 w-3.5" /></button>
      <button
        onClick={() => { setErr(null); start(async () => { const r = await actions.deleteSlot(slot.id); if (r.error) setErr(r.error) }) }}
        disabled={pending}
        className="text-ink-muted hover:text-neg disabled:opacity-50"
      ><Trash2 className="h-3.5 w-3.5" /></button>
      {err && <span className="text-neg">{err}</span>}
    </div>
  )
}

function SlotForm({ categoryId, slotId, initial, onClose }: { categoryId: string; slotId?: string; initial: SlotVM | Omit<SlotVM, 'id'>; onClose: () => void }) {
  const [slot_key, setKey] = useState(initial.slot_key)
  const [question, setQuestion] = useState(initial.question)
  const [input, setInput] = useState(initial.input)
  const [optionsText, setOptionsText] = useState((initial.options ?? []).join('\n'))
  const [sortOrder, setSortOrder] = useState(String(initial.sort_order))
  const [conditional, setConditional] = useState(initial.conditional)
  const [isActive, setIsActive] = useState(initial.is_active)
  const [err, setErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function submit() {
    setErr(null)
    const payload: SlotInput = {
      slot_key, question, input,
      options: input === 'chips' || input === 'dropdown' ? lines(optionsText) : [],
      sort_order: Number(sortOrder) || 0,
      conditional, is_active: isActive,
    }
    start(async () => {
      const res = slotId ? await actions.updateSlot(slotId, payload) : await actions.createSlot(categoryId, payload)
      if (res.error) setErr(res.error)
      else onClose()
    })
  }

  const showOptions = input === 'chips' || input === 'dropdown'
  return (
    <div className="rounded-lg border border-primary/40 bg-canvas p-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        <Field label="Slot key"><input className={`${inputCls} w-40`} value={slot_key} onChange={(e) => setKey(e.target.value)} placeholder="issue_type" /></Field>
        <Field label="Input"><select className={inputCls} value={input} onChange={(e) => setInput(e.target.value)}>{INPUTS.map((i) => <option key={i} value={i}>{i}</option>)}</select></Field>
        <Field label="Order"><input type="number" className={`${inputCls} w-20`} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} /></Field>
      </div>
      <Field label="Question"><input className={inputCls} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What is the issue?" /></Field>
      {showOptions && <Field label="Options (one per line)"><textarea className={`${inputCls} h-20`} value={optionsText} onChange={(e) => setOptionsText(e.target.value)} /></Field>}
      <div className="flex items-center gap-4 text-[12px] text-ink-muted">
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={conditional} onChange={(e) => setConditional(e.target.checked)} />Conditional</label>
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />Active</label>
      </div>
      {err && <p className="text-[12px] text-neg">{err}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className={btnCls}><X className="h-3.5 w-3.5" />Cancel</button>
        <button onClick={submit} disabled={pending} className={primaryBtn}><Check className="h-3.5 w-3.5" />{pending ? 'Saving…' : 'Save question'}</button>
      </div>
    </div>
  )
}

// ── KB panel ──────────────────────────────────────────────────────────────────
function KbPanel({ kb, categories }: { kb: KbArticleVM[]; categories: CategoryVM[] }) {
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? 'General'

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => { setAdding(true); setEditId(null) }} className={btnCls}><Plus className="h-3.5 w-3.5" />Add answer</button>
      </div>
      {adding && <KbForm categories={categories} initial={{ category_id: categories[0]?.id ?? '', title: '', symptoms: [], steps: [] }} onClose={() => setAdding(false)} />}
      {kb.length === 0 && !adding && <Empty>No self-help answers yet. These let the agent deflect issues tenants can fix themselves.</Empty>}
      <div className="space-y-2">
        {kb.map((a) =>
          editId === a.id ? (
            <KbForm key={a.id} categories={categories} articleId={a.id} initial={a} onClose={() => setEditId(null)} />
          ) : (
            <div key={a.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-ink text-[14px]">{a.title}</p>
                  <p className="text-[12px] text-ink-muted">{catName(a.category_id)} · matches: {a.symptoms.join(', ') || '—'}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditId(a.id); setAdding(false) }} className="text-ink-muted hover:text-ink"><Pencil className="h-4 w-4" /></button>
                  <KbDelete id={a.id} />
                </div>
              </div>
              <ol className="mt-2 list-decimal list-inside space-y-0.5 text-[12px] text-ink-muted">{a.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
            </div>
          )
        )}
      </div>
    </div>
  )
}

function KbDelete({ id }: { id: string }) {
  const [pending, start] = useTransition()
  const [err, setErr] = useState<string | null>(null)
  return (
    <>
      <button onClick={() => { setErr(null); start(async () => { const r = await actions.deleteKbArticle(id); if (r.error) setErr(r.error) }) }} disabled={pending} className="text-ink-muted hover:text-neg disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
      {err && <span className="text-[11px] text-neg">{err}</span>}
    </>
  )
}

function KbForm({ categories, articleId, initial, onClose }: { categories: CategoryVM[]; articleId?: string; initial: Omit<KbArticleVM, 'id'>; onClose: () => void }) {
  const [categoryId, setCategoryId] = useState(initial.category_id)
  const [title, setTitle] = useState(initial.title)
  const [symptomsText, setSymptomsText] = useState(initial.symptoms.join('\n'))
  const [stepsText, setStepsText] = useState(initial.steps.join('\n'))
  const [err, setErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function submit() {
    setErr(null)
    const payload: KbInput = { title, symptoms: lines(symptomsText), steps: lines(stepsText) }
    start(async () => {
      const res = articleId ? await actions.updateKbArticle(articleId, categoryId, payload) : await actions.createKbArticle(categoryId, payload)
      if (res.error) setErr(res.error)
      else onClose()
    })
  }

  return (
    <div className="rounded-xl border border-primary/40 bg-canvas p-4 space-y-2">
      <div className="flex flex-wrap gap-2">
        <Field label="Category"><select className={inputCls} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}><option value="">General</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Title" className="min-w-[200px] flex-1"><input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      </div>
      <Field label="Match keywords (one per line) — used to offer this answer"><textarea className={`${inputCls} h-16`} value={symptomsText} onChange={(e) => setSymptomsText(e.target.value)} /></Field>
      <Field label="Steps (one per line)"><textarea className={`${inputCls} h-28`} value={stepsText} onChange={(e) => setStepsText(e.target.value)} /></Field>
      {err && <p className="text-[12px] text-neg">{err}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className={btnCls}><X className="h-3.5 w-3.5" />Cancel</button>
        <button onClick={submit} disabled={pending} className={primaryBtn}><Check className="h-3.5 w-3.5" />{pending ? 'Saving…' : 'Save answer'}</button>
      </div>
    </div>
  )
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[11px] font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  )
}
