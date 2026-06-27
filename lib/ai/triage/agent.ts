import OpenAI from 'openai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { buildTriageSystemPrompt } from './system-prompt'
import { TriageTurnSchema, TRIAGE_TURN_JSON_SCHEMA } from './contract'
import type { TriageTurn, IntakeThread } from './contract'
import { EMERGENCY_KEYWORDS, SAFETY_ESCALATION_SCRIPT } from '@/lib/maintenance/slot-config'
import type { CategorySlotConfig } from '@/lib/maintenance/slot-config'
import { loadTriageConfig, findCategoryConfig } from '@/lib/maintenance/triage-config'
import { finalizeTriage, lookupSelfHelp } from './tools'

const QUESTION_CAP = 5
const CONFIDENCE_FLOOR = 0.6

// Model IDs — kept in config, not inline. Use the default when the env var is
// unset OR set to an empty/whitespace value (a blank Vercel var would otherwise
// send model="" and OpenAI 400s with "you must provide a model parameter").
const MODEL_WORKHORSE = (process.env.TRIAGE_MODEL_WORKHORSE ?? '').trim() || 'gpt-4o-mini'
const MODEL_ESCALATION = (process.env.TRIAGE_MODEL_ESCALATION ?? '').trim() || 'gpt-4o'

export interface AgentInput {
  threadId?: string
  message: string | { imageBase64: string; mediaType: string }
  companyId: string
  occupancyId?: string | null
  tenantId?: string | null
  propertyId?: string | null
  buildingId?: string | null
  source?: string
}

export interface AgentOutput {
  turn: TriageTurn
  threadId: string
  jobId?: string
}

export async function runTriageAgent(
  supabase: SupabaseClient,
  input: AgentInput
): Promise<AgentOutput> {
  const { companyId, occupancyId = null, tenantId = null, propertyId = null, buildingId = null, source = 'web' } = input

  // ── STEP 1: Emergency scan — deterministic, runs before any model call ──────
  const rawText = typeof input.message === 'string' ? input.message : ''
  if (rawText && containsEmergencyKeyword(rawText)) {
    const thread = await upsertThread(supabase, {
      companyId, occupancyId, tenantId, source,
      existingId: input.threadId,
      status: 'emergency',
    })
    await appendMessage(supabase, thread.id, 'tenant', { text: rawText })
    await appendMessage(supabase, thread.id, 'agent', { text: SAFETY_ESCALATION_SCRIPT })

    const emergencyTurn: TriageTurn = {
      extracted: {},
      category: null,
      confidence: 0,
      action: 'emergency',
      self_help: { title: 'Emergency — contact emergency services', steps: SAFETY_ESCALATION_SCRIPT.split('\n').filter(Boolean) },
    }
    return { turn: emergencyTurn, threadId: thread.id }
  }

  // ── STEP 2: Load or create thread ────────────────────────────────────────────
  const thread = await upsertThread(supabase, {
    companyId, occupancyId, tenantId, source,
    existingId: input.threadId,
    status: 'open',
  })

  // Load the (editable) triage checklist for this company — DB-backed with a
  // fallback to the code defaults. Single source the prompt + finalize read.
  const configs = await loadTriageConfig(supabase, companyId)

  // ── STEP 3: Append tenant message ────────────────────────────────────────────
  if (typeof input.message === 'string') {
    await appendMessage(supabase, thread.id, 'tenant', { text: input.message })
  } else {
    await appendMessage(supabase, thread.id, 'tenant', {
      image_ref: 'base64_upload',
      media_type: input.message.mediaType,
    })
  }

  // ── STEP 4: Load full message history ────────────────────────────────────────
  const { data: messages } = await supabase
    .from('maintenance_intake_messages')
    .select('role, content')
    .eq('thread_id', thread.id)
    .order('created_at', { ascending: true })

  const history = (messages ?? []).map((m) => ({
    role: m.role === 'tenant' ? 'user' : 'assistant',
    content: typeof m.content === 'string' ? m.content : contentToText(m.content),
  })) as OpenAI.Chat.ChatCompletionMessageParam[]

  // ── STEP 5: Build system prompt ───────────────────────────────────────────────
  const questionBudget = Math.max(0, QUESTION_CAP - thread.question_count)
  const systemPrompt = buildTriageSystemPrompt({
    slots: thread.slots,
    categorySlug: thread.category_slug,
    questionBudget,
    configs,
  })

  // ── STEP 6: Call model with structured JSON output ────────────────────────────
  const isLowConfidence = thread.confidence != null && thread.confidence < CONFIDENCE_FLOOR && thread.question_count > 0
  const isImageMessage = typeof input.message !== 'string'
  const useEscalation = isLowConfidence || isImageMessage
  const model = useEscalation ? MODEL_ESCALATION : MODEL_WORKHORSE

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  let rawTurn: TriageTurn

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...history],
      temperature: 0.2,
      max_tokens: 600,
      response_format: {
        type: 'json_schema',
        json_schema: TRIAGE_TURN_JSON_SCHEMA,
      } as OpenAI.ResponseFormatJSONSchema,
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const parsed = TriageTurnSchema.safeParse(JSON.parse(raw))

    if (!parsed.success) {
      // Fall back: ask the model to restate as valid JSON
      rawTurn = await requestFallbackTurn(openai, model, systemPrompt, history, parsed.error.message)
    } else {
      rawTurn = parsed.data
    }
  } catch (err) {
    throw new Error(`[triage/agent] OpenAI call failed: ${err instanceof Error ? err.message : String(err)}`)
  }

  // ── STEP 7: Enforce budget cap ────────────────────────────────────────────────
  if (questionBudget <= 0 && rawTurn.action === 'ask') {
    rawTurn = { ...rawTurn, action: 'finalize', job: buildFallbackJob(thread, rawTurn, configs) }
  }

  // ── STEP 8: Merge extracted slots + persist ───────────────────────────────────
  const newSlots = { ...thread.slots, ...rawTurn.extracted }
  const categoryId = thread.category_id ?? await resolveCategoryId(supabase, companyId, rawTurn.category)
  const updates: Record<string, unknown> = {
    slots: newSlots,
    confidence: rawTurn.confidence,
    category_id: categoryId,
  }
  if (rawTurn.action === 'ask') {
    updates.question_count = thread.question_count + 1
  }
  await supabase.from('maintenance_intake_threads').update(updates).eq('id', thread.id)

  // ── STEP 9: Dispatch on action ────────────────────────────────────────────────
  let jobId: string | undefined

  if (rawTurn.action === 'self_help') {
    // Look up KB article for richer steps
    const symptoms = extractSymptoms(rawText, newSlots)
    if (categoryId) {
      const article = await lookupSelfHelp(supabase, categoryId, symptoms)
      if (article) {
        rawTurn = { ...rawTurn, self_help: { title: article.title, steps: article.steps } }
      }
    }
    await supabase.from('maintenance_intake_threads').update({ status: 'deflected' }).eq('id', thread.id)
    const stepsText = rawTurn.self_help?.steps.join('\n') ?? 'Please try the suggested steps.'
    await appendMessage(supabase, thread.id, 'agent', { text: rawTurn.self_help?.title ?? 'Self-help', steps: rawTurn.self_help?.steps })
    console.log('[triage/agent] self_help', { stepsText })
  }

  if (rawTurn.action === 'ask' && rawTurn.question) {
    await appendMessage(supabase, thread.id, 'agent', {
      input: rawTurn.question.input,
      slot: rawTurn.question.slot,
      text: rawTurn.question.text,
      options: rawTurn.question.options,
    })
  }

  if (rawTurn.action === 'finalize' && rawTurn.job) {
    const slotConfig = findCategoryConfig(configs, rawTurn.category ?? 'other')
    const result = await finalizeTriage({
      supabase,
      companyId,
      threadId: thread.id,
      occupancyId,
      tenantId,
      propertyId,
      buildingId,
      categoryId,
      payload: {
        ...rawTurn.job,
        sla_hours: slotConfig?.defaultSlaHours ?? rawTurn.job.sla_hours,
        priority: slotConfig?.defaultPriority ?? rawTurn.job.priority,
      },
      source,
    })
    jobId = result.jobId
    await appendMessage(supabase, thread.id, 'agent', {
      text: `Your maintenance request has been logged (ID: ${result.jobId}). A member of our team will be in touch.`,
      job_id: result.jobId,
    })
  }

  // Strip internal note from client response
  const { note: _note, ...clientTurn } = rawTurn

  return { turn: clientTurn as TriageTurn, threadId: thread.id, jobId }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function containsEmergencyKeyword(text: string): boolean {
  const lower = text.toLowerCase()
  return EMERGENCY_KEYWORDS.some((kw) => lower.includes(kw))
}

interface ThreadState {
  id: string
  category_id: string | null
  category_slug: string | null
  status: string
  slots: Record<string, unknown>
  confidence: number | null
  question_count: number
}

async function upsertThread(
  supabase: SupabaseClient,
  opts: {
    companyId: string
    occupancyId: string | null
    tenantId: string | null
    source: string
    existingId?: string
    status: string
  }
): Promise<ThreadState> {
  if (opts.existingId) {
    const { data } = await supabase
      .from('maintenance_intake_threads')
      .select('id, category_id, status, slots, confidence, question_count, maintenance_categories(slug)')
      .eq('id', opts.existingId)
      .single()
    if (data) {
      return {
        id: data.id,
        category_id: data.category_id,
        category_slug: (data.maintenance_categories as any)?.slug ?? null,
        status: data.status,
        slots: data.slots ?? {},
        confidence: data.confidence,
        question_count: data.question_count ?? 0,
      }
    }
  }

  const { data, error } = await supabase
    .from('maintenance_intake_threads')
    .insert({
      company_id: opts.companyId,
      occupancy_id: opts.occupancyId,
      tenant_id: opts.tenantId,
      source: opts.source,
      status: opts.status,
    })
    .select('id, category_id, status, slots, confidence, question_count')
    .single()

  if (error || !data) throw new Error(`[triage/agent] thread create failed: ${error?.message}`)

  return {
    id: data.id,
    category_id: null,
    category_slug: null,
    status: data.status,
    slots: {},
    confidence: null,
    question_count: 0,
  }
}

async function appendMessage(
  supabase: SupabaseClient,
  threadId: string,
  role: 'tenant' | 'agent',
  content: Record<string, unknown>
) {
  await supabase.from('maintenance_intake_messages').insert({ thread_id: threadId, role, content })
}

async function resolveCategoryId(
  supabase: SupabaseClient,
  companyId: string,
  categorySlug: string | null
): Promise<string | null> {
  if (!categorySlug) return null
  const { data } = await supabase
    .from('maintenance_categories')
    .select('id')
    .eq('company_id', companyId)
    .eq('slug', categorySlug)
    .single()
  return data?.id ?? null
}

function contentToText(content: Record<string, unknown>): string {
  if (content.text) return String(content.text)
  if (content.input && content.text) return `[${content.input}] ${content.text}`
  return JSON.stringify(content)
}

function extractSymptoms(rawText: string, slots: Record<string, unknown>): string[] {
  const parts: string[] = []
  if (rawText) parts.push(...rawText.split(/\s+/).filter((w) => w.length > 3))
  for (const v of Object.values(slots)) {
    if (typeof v === 'string') parts.push(v)
  }
  return [...new Set(parts.map((p) => p.toLowerCase()))]
}

function buildFallbackJob(thread: ThreadState, turn: TriageTurn, configs: CategorySlotConfig[]) {
  const config = findCategoryConfig(configs, turn.category ?? 'other')
  return {
    category: turn.category ?? 'other',
    priority: config?.defaultPriority ?? 'medium',
    sla_hours: config?.defaultSlaHours ?? 72,
    routing: config?.routing ?? 'internal_manager',
    summary: summariseSlots(thread.slots),
    blocking_leasing: false,
    slots: thread.slots,
  }
}

function summariseSlots(slots: Record<string, unknown>): string {
  const parts = Object.entries(slots)
    .filter(([k]) => !['photo'].includes(k))
    .map(([k, v]) => `${k}: ${v}`)
  return parts.length ? parts.join(', ') : 'Maintenance request'
}

async function requestFallbackTurn(
  openai: OpenAI,
  model: string,
  systemPrompt: string,
  history: OpenAI.Chat.ChatCompletionMessageParam[],
  parseError: string
): Promise<TriageTurn> {
  const retry = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: `Your previous response was not valid JSON. Parse error: ${parseError}. Reply ONLY with a valid TriageTurn JSON object.` },
    ],
    temperature: 0,
    max_tokens: 400,
    response_format: {
      type: 'json_schema',
      json_schema: TRIAGE_TURN_JSON_SCHEMA,
    } as OpenAI.ResponseFormatJSONSchema,
  })
  const raw = retry.choices[0]?.message?.content ?? '{}'
  const parsed = TriageTurnSchema.safeParse(JSON.parse(raw))
  if (!parsed.success) {
    // Last resort: ask one more clarifying question
    return {
      extracted: {},
      category: null,
      confidence: 0,
      action: 'ask',
      question: {
        slot: 'description',
        text: 'Could you describe the issue in a few words?',
        input: 'text',
      },
    }
  }
  return parsed.data
}
