import type { SupabaseClient } from '@supabase/supabase-js'
import { getSlotConfig } from '@/lib/maintenance/slot-config'
import type { SlotSpec } from '@/lib/maintenance/slot-config'
import type { JobPayload } from './contract'

// ── get_required_slots ────────────────────────────────────────────────────────

export function getRequiredSlots(categorySlug: string): SlotSpec[] {
  return getSlotConfig(categorySlug)?.slots ?? []
}

// ── check_duplicates ──────────────────────────────────────────────────────────
// Returns recent open jobs for the same occupancy + category (last 30 days).

export interface DuplicateCandidate {
  id: string
  job_number: string | null
  title: string
  status: string
  created_at: string
}

export async function checkDuplicates(
  supabase: SupabaseClient,
  occupancyId: string,
  categoryId: string
): Promise<DuplicateCandidate[]> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('maintenance_jobs')
    .select('id, job_number, title, status, created_at')
    .eq('occupancy_id', occupancyId)
    .eq('category_id', categoryId)
    .not('status', 'in', '("completed","closed","cancelled","duplicate")')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('[triage/check_duplicates]', error.message)
    return []
  }
  return (data ?? []) as DuplicateCandidate[]
}

// ── lookup_self_help ──────────────────────────────────────────────────────────
// Returns the first KB article whose symptoms overlap with the given keywords.

export interface KbArticle {
  id: string
  title: string
  steps: string[]
}

export async function lookupSelfHelp(
  supabase: SupabaseClient,
  categoryId: string,
  symptoms: string[]
): Promise<KbArticle | null> {
  const { data, error } = await supabase
    .from('maintenance_kb_articles')
    .select('id, title, symptoms, steps')
    .eq('category_id', categoryId)

  if (error || !data) return null

  const lower = symptoms.map((s) => s.toLowerCase())

  for (const article of data) {
    const articleSymptoms: string[] = (article.symptoms ?? []).map((s: string) => s.toLowerCase())
    if (lower.some((sym) => articleSymptoms.some((as) => as.includes(sym) || sym.includes(as)))) {
      return { id: article.id, title: article.title, steps: article.steps }
    }
  }
  return null
}

// ── finalize_triage ───────────────────────────────────────────────────────────
// Writes a maintenance_jobs row (status 'triage'), links the thread.

export interface FinalizeInput {
  supabase: SupabaseClient
  companyId: string
  threadId: string
  occupancyId: string | null
  tenantId: string | null
  propertyId?: string | null
  buildingId?: string | null
  categoryId: string | null
  payload: JobPayload
  source: string
}

export interface FinalizeResult {
  jobId: string
}

export async function finalizeTriage(input: FinalizeInput): Promise<FinalizeResult> {
  const { supabase, companyId, threadId, occupancyId, tenantId, propertyId = null, buildingId = null, categoryId, payload, source } = input

  const dueAt = payload.sla_hours
    ? new Date(Date.now() + payload.sla_hours * 60 * 60 * 1000).toISOString().slice(0, 10)
    : null

  const jobInsert = {
    company_id:         companyId,
    occupancy_id:       occupancyId,
    tenant_id:          tenantId,
    property_id:        propertyId,
    building_id:        buildingId,
    category_id:        categoryId,
    title:              payload.summary,
    priority:           payload.priority,
    status:             'triage' as const,
    source:             source,
    external_notes:     JSON.stringify(payload.slots, null, 2),
    due_date:           dueAt,
    blocking_leasing:   payload.blocking_leasing,
  }

  const { data: job, error: jobError } = await supabase
    .from('maintenance_jobs')
    .insert(jobInsert)
    .select('id')
    .single()

  if (jobError || !job) {
    throw new Error(`finalize_triage: insert failed — ${jobError?.message}`)
  }

  const { error: threadError } = await supabase
    .from('maintenance_intake_threads')
    .update({ status: 'finalized', job_id: job.id })
    .eq('id', threadId)

  if (threadError) {
    console.error('[triage/finalize_triage] thread link failed:', threadError.message)
  }

  return { jobId: job.id }
}
