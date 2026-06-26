export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { EMERGENCY_KEYWORDS } from '@/lib/maintenance/slot-config'
import TriageSettingsClient, {
  type CategoryVM,
  type KbArticleVM,
} from './_components/triage-settings-client'

async function getData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { categories: [], kb: [] }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.company_id) return { categories: [], kb: [] }

  const [{ data: cats }, { data: slots }, { data: kb }] = await Promise.all([
    supabase
      .from('maintenance_categories')
      .select('id, slug, name, default_priority, default_sla_hours, triage_routing, sort_order')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('triage_slots')
      .select('id, category_id, slot_key, question, input, options, sort_order, conditional, is_active')
      .eq('company_id', profile.company_id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('maintenance_kb_articles')
      .select('id, category_id, title, symptoms, steps')
      .eq('company_id', profile.company_id)
      .order('title', { ascending: true }),
  ])

  const slotsByCat = new Map<string, CategoryVM['slots']>()
  for (const s of slots ?? []) {
    const arr = slotsByCat.get(s.category_id) ?? []
    arr.push({
      id: s.id,
      slot_key: s.slot_key,
      question: s.question,
      input: s.input,
      options: s.options ?? [],
      sort_order: s.sort_order,
      conditional: s.conditional,
      is_active: s.is_active,
    })
    slotsByCat.set(s.category_id, arr)
  }

  const categories: CategoryVM[] = (cats ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name ?? c.slug,
    default_priority: c.default_priority ?? 'medium',
    default_sla_hours: c.default_sla_hours ?? 72,
    triage_routing: c.triage_routing ?? '',
    slots: slotsByCat.get(c.id) ?? [],
  }))

  const kbArticles: KbArticleVM[] = (kb ?? []).map((a) => ({
    id: a.id,
    category_id: a.category_id ?? '',
    title: a.title,
    symptoms: a.symptoms ?? [],
    steps: a.steps ?? [],
  }))

  return { categories, kb: kbArticles }
}

export default async function TriageSettingsPage() {
  const { categories, kb } = await getData()

  const status = {
    enabled: !!process.env.TRIAGE_AGENT_ENABLED,
    hasKey: !!process.env.OPENAI_API_KEY,
    workhorse: process.env.TRIAGE_MODEL_WORKHORSE ?? 'gpt-4o-mini',
    escalation: process.env.TRIAGE_MODEL_ESCALATION ?? 'gpt-4o',
    emergencyKeywords: EMERGENCY_KEYWORDS,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Triage Agent</h1>
        <p className="text-[13px] text-ink-muted mt-1">
          Teach the agent: edit the self-help answers it offers, and the categories and questions
          it uses to triage tenant maintenance reports. Changes take effect immediately — no deploy.
        </p>
      </div>
      <TriageSettingsClient categories={categories} kb={kb} status={status} />
    </div>
  )
}
