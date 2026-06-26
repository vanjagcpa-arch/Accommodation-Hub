import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { loadTriageConfig, findCategoryConfig } from '../triage-config'
import { SLOT_CONFIG } from '../slot-config'

// Minimal chainable mock: from() routes by table; terminal .order() resolves.
function mockSupabase(catData: unknown[] | null, slotData: unknown[] | null): SupabaseClient {
  const builder = (rows: unknown[] | null) => {
    const b: Record<string, unknown> = {}
    b.select = () => b
    b.eq = () => b
    b.in = () => b
    b.order = () => Promise.resolve({ data: rows, error: null })
    return b
  }
  return {
    from: (table: string) =>
      table === 'maintenance_categories' ? builder(catData) : builder(slotData),
  } as unknown as SupabaseClient
}

describe('loadTriageConfig', () => {
  it('maps DB categories + slots into CategorySlotConfig', async () => {
    const supabase = mockSupabase(
      [{ id: 'c1', slug: 'plumbing', name: 'Plumbing', default_priority: 'high', default_sla_hours: 24, triage_routing: 'internal_plumber' }],
      [{ category_id: 'c1', slot_key: 'issue_type', question: 'What type?', input: 'chips', options: ['A', 'B'], conditional: false }]
    )

    const configs = await loadTriageConfig(supabase, 'company-1')
    const plumbing = findCategoryConfig(configs, 'plumbing')

    expect(plumbing).toBeDefined()
    expect(plumbing!.routing).toBe('internal_plumber')
    expect(plumbing!.defaultPriority).toBe('high')
    expect(plumbing!.slots).toHaveLength(1)
    expect(plumbing!.slots[0].key).toBe('issue_type')
    expect(plumbing!.slots[0].options).toEqual(['A', 'B'])
  })

  it('keeps code-only categories the model might still emit', async () => {
    const supabase = mockSupabase(
      [{ id: 'c1', slug: 'plumbing', name: 'Plumbing', default_priority: 'high', default_sla_hours: 24, triage_routing: 'internal_plumber' }],
      []
    )
    const configs = await loadTriageConfig(supabase, 'company-1')
    // electrical etc. are not in the DB rows but must still be present.
    expect(findCategoryConfig(configs, 'electrical')).toBeDefined()
    expect(findCategoryConfig(configs, 'other')).toBeDefined()
  })

  it('falls back to a category code config when it has no DB slots', async () => {
    const supabase = mockSupabase(
      [{ id: 'c1', slug: 'plumbing', name: 'Plumbing', default_priority: 'high', default_sla_hours: 24, triage_routing: null }],
      [] // no slots for plumbing
    )
    const configs = await loadTriageConfig(supabase, 'company-1')
    const plumbing = findCategoryConfig(configs, 'plumbing')!
    const codePlumbing = SLOT_CONFIG.find((c) => c.categorySlug === 'plumbing')!
    expect(plumbing.slots).toEqual(codePlumbing.slots)
    // routing falls back to the code default when DB routing is null
    expect(plumbing.routing).toBe(codePlumbing.routing)
  })

  it('returns the full code config when there are no categories at all', async () => {
    const supabase = mockSupabase([], [])
    const configs = await loadTriageConfig(supabase, 'company-1')
    expect(configs).toBe(SLOT_CONFIG)
  })
})
