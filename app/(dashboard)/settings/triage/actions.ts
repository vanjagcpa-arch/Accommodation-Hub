'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

const PRIORITIES = ['urgent', 'high', 'medium', 'low']
const INPUTS = ['chips', 'dropdown', 'toggle', 'text', 'photo']

async function ctx(): Promise<{ supabase: SupabaseClient; companyId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.company_id) return { error: 'No company on profile.' }
  return { supabase, companyId: profile.company_id }
}

function done() {
  revalidatePath('/settings/triage')
}

// ── Categories ────────────────────────────────────────────────────────────────
export async function updateCategory(
  id: string,
  fields: { name?: string; default_priority?: string; default_sla_hours?: number; triage_routing?: string }
): Promise<{ error?: string }> {
  const c = await ctx()
  if ('error' in c) return c

  const patch: Record<string, unknown> = {}
  if (fields.name !== undefined) patch.name = fields.name.trim()
  if (fields.default_priority !== undefined) {
    if (!PRIORITIES.includes(fields.default_priority)) return { error: 'Invalid priority.' }
    patch.default_priority = fields.default_priority
  }
  if (fields.default_sla_hours !== undefined) {
    if (!Number.isFinite(fields.default_sla_hours) || fields.default_sla_hours < 0) return { error: 'Invalid SLA hours.' }
    patch.default_sla_hours = Math.round(fields.default_sla_hours)
  }
  if (fields.triage_routing !== undefined) patch.triage_routing = fields.triage_routing.trim() || null

  const { error } = await c.supabase.from('maintenance_categories').update(patch).eq('id', id).eq('company_id', c.companyId)
  if (error) return { error: 'Update failed — you may not have permission.' }
  done()
  return {}
}

// ── Slots (questions) ─────────────────────────────────────────────────────────
export interface SlotInput {
  slot_key: string
  question: string
  input: string
  options: string[]
  sort_order: number
  conditional: boolean
  is_active: boolean
}

function validateSlot(s: SlotInput): string | null {
  if (!s.slot_key.trim()) return 'Slot key is required.'
  if (!/^[a-z0-9_]+$/.test(s.slot_key.trim())) return 'Slot key must be lowercase letters, numbers, and underscores.'
  if (!s.question.trim()) return 'Question text is required.'
  if (!INPUTS.includes(s.input)) return 'Invalid input type.'
  return null
}

export async function createSlot(categoryId: string, s: SlotInput): Promise<{ error?: string }> {
  const c = await ctx()
  if ('error' in c) return c
  const v = validateSlot(s)
  if (v) return { error: v }

  const { error } = await c.supabase.from('triage_slots').insert({
    company_id: c.companyId,
    category_id: categoryId,
    slot_key: s.slot_key.trim(),
    question: s.question.trim(),
    input: s.input,
    options: s.options.length ? s.options : null,
    sort_order: s.sort_order,
    conditional: s.conditional,
    is_active: s.is_active,
  })
  if (error) return { error: error.message.includes('duplicate') ? 'A slot with that key already exists for this category.' : 'Create failed — you may not have permission.' }
  done()
  return {}
}

export async function updateSlot(id: string, s: SlotInput): Promise<{ error?: string }> {
  const c = await ctx()
  if ('error' in c) return c
  const v = validateSlot(s)
  if (v) return { error: v }

  const { error } = await c.supabase.from('triage_slots').update({
    slot_key: s.slot_key.trim(),
    question: s.question.trim(),
    input: s.input,
    options: s.options.length ? s.options : null,
    sort_order: s.sort_order,
    conditional: s.conditional,
    is_active: s.is_active,
  }).eq('id', id).eq('company_id', c.companyId)
  if (error) return { error: 'Update failed — you may not have permission.' }
  done()
  return {}
}

export async function deleteSlot(id: string): Promise<{ error?: string }> {
  const c = await ctx()
  if ('error' in c) return c
  const { error } = await c.supabase.from('triage_slots').delete().eq('id', id).eq('company_id', c.companyId)
  if (error) return { error: 'Delete failed — you may not have permission.' }
  done()
  return {}
}

// ── Self-help KB articles ─────────────────────────────────────────────────────
export interface KbInput {
  title: string
  symptoms: string[]
  steps: string[]
}

function validateKb(k: KbInput): string | null {
  if (!k.title.trim()) return 'Title is required.'
  if (k.steps.length === 0) return 'Add at least one step.'
  return null
}

export async function createKbArticle(categoryId: string, k: KbInput): Promise<{ error?: string }> {
  const c = await ctx()
  if ('error' in c) return c
  const v = validateKb(k)
  if (v) return { error: v }

  const { error } = await c.supabase.from('maintenance_kb_articles').insert({
    company_id: c.companyId,
    category_id: categoryId || null,
    title: k.title.trim(),
    symptoms: k.symptoms.length ? k.symptoms : null,
    steps: k.steps,
  })
  if (error) return { error: 'Create failed — you may not have permission.' }
  done()
  return {}
}

export async function updateKbArticle(id: string, categoryId: string, k: KbInput): Promise<{ error?: string }> {
  const c = await ctx()
  if ('error' in c) return c
  const v = validateKb(k)
  if (v) return { error: v }

  const { error } = await c.supabase.from('maintenance_kb_articles').update({
    category_id: categoryId || null,
    title: k.title.trim(),
    symptoms: k.symptoms.length ? k.symptoms : null,
    steps: k.steps,
  }).eq('id', id).eq('company_id', c.companyId)
  if (error) return { error: 'Update failed — you may not have permission.' }
  done()
  return {}
}

export async function deleteKbArticle(id: string): Promise<{ error?: string }> {
  const c = await ctx()
  if ('error' in c) return c
  const { error } = await c.supabase.from('maintenance_kb_articles').delete().eq('id', id).eq('company_id', c.companyId)
  if (error) return { error: 'Delete failed — you may not have permission.' }
  done()
  return {}
}
