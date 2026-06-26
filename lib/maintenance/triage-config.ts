import type { SupabaseClient } from '@supabase/supabase-js'
import { SLOT_CONFIG, getSlotConfig } from './slot-config'
import type { CategorySlotConfig, SlotSpec, InputType } from './slot-config'

// Loads the per-category triage checklist from the database so it can be
// managed in Settings → Triage. Falls back to the hard-coded SLOT_CONFIG when
// the DB has no rows yet (e.g. migration 012 not run) or on any error, so the
// agent keeps working no matter what. This is the single source the agent reads.

interface CategoryRow {
  id: string
  slug: string
  name: string | null
  default_priority: CategorySlotConfig['defaultPriority'] | null
  default_sla_hours: number | null
  triage_routing: string | null
}

interface SlotRow {
  category_id: string
  slot_key: string
  question: string
  input: InputType
  options: string[] | null
  conditional: boolean | null
}

export async function loadTriageConfig(
  supabase: SupabaseClient,
  companyId: string
): Promise<CategorySlotConfig[]> {
  try {
    const { data: cats, error: catErr } = await supabase
      .from('maintenance_categories')
      .select('id, slug, name, default_priority, default_sla_hours, triage_routing')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (catErr || !cats || cats.length === 0) return SLOT_CONFIG

    const catRows = cats as CategoryRow[]
    const { data: slots } = await supabase
      .from('triage_slots')
      .select('category_id, slot_key, question, input, options, conditional')
      .in('category_id', catRows.map((c) => c.id))
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    const slotsByCat = new Map<string, SlotRow[]>()
    for (const s of (slots ?? []) as SlotRow[]) {
      const arr = slotsByCat.get(s.category_id) ?? []
      arr.push(s)
      slotsByCat.set(s.category_id, arr)
    }

    const configs: CategorySlotConfig[] = catRows.map((c) => {
      const fallback = getSlotConfig(c.slug)
      const rows = slotsByCat.get(c.id) ?? []
      const slotSpecs: SlotSpec[] =
        rows.length > 0
          ? rows.map((r) => ({
              key: r.slot_key,
              question: r.question,
              input: r.input,
              options: r.options ?? undefined,
              conditional: r.conditional ?? undefined,
            }))
          : fallback?.slots ?? []
      return {
        categorySlug: c.slug,
        displayName: c.name ?? fallback?.displayName ?? c.slug,
        defaultPriority: c.default_priority ?? fallback?.defaultPriority ?? 'medium',
        defaultSlaHours: c.default_sla_hours ?? fallback?.defaultSlaHours ?? 72,
        routing: c.triage_routing ?? fallback?.routing ?? 'internal_manager',
        slots: slotSpecs,
        emergencyTriggers: fallback?.emergencyTriggers,
      }
    })

    // Keep any code-only categories the model might still emit (e.g. a slug not
    // yet seeded in this company) so classification never dead-ends.
    for (const code of SLOT_CONFIG) {
      if (!configs.some((c) => c.categorySlug === code.categorySlug)) configs.push(code)
    }

    return configs
  } catch {
    return SLOT_CONFIG
  }
}

export function findCategoryConfig(
  configs: CategorySlotConfig[],
  slug: string | null | undefined
): CategorySlotConfig | undefined {
  if (!slug) return undefined
  return configs.find((c) => c.categorySlug === slug)
}
