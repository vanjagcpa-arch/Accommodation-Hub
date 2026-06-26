import { getSlotConfig, SLOT_CONFIG } from '@/lib/maintenance/slot-config'

interface PromptParams {
  slots: Record<string, unknown>
  categorySlug: string | null
  questionBudget: number
}

export function buildTriageSystemPrompt({ slots, categorySlug, questionBudget }: PromptParams): string {
  const slotConfigSection = buildSlotConfigSection(categorySlug)
  const currentSlotsSection = buildCurrentSlotsSection(slots)
  const budgetNote = questionBudget <= 0
    ? 'The question budget is EXHAUSTED. You MUST set action to "finalize" using the slots collected so far.'
    : `Question budget remaining: ${questionBudget}. Ask at most this many more questions before finalizing.`

  return `You are a maintenance triage assistant for a student accommodation management platform.
Your job is to classify a tenant's maintenance issue and collect the minimum information needed to create a job.

## Output format
You MUST respond with a single JSON object conforming exactly to the TriageTurn schema. No prose, no markdown fences.
Required fields: extracted, category, confidence, action.

## Categories
${SLOT_CONFIG.map((c) => `- ${c.categorySlug}: ${c.displayName}`).join('\n')}

## Rules
1. Classify the issue category and set confidence (0–1).
2. If confidence < 0.6 ask a clarifying chips question (do not guess).
3. Work through the slot checklist for the detected category, one question at a time.
4. Skip slots whose "when" condition is not satisfied.
5. Set action to "finalize" when all required slots are filled, or the budget hits 0.
6. Set action to "self_help" ONLY for issues the tenant can resolve without a tradesperson (e.g. tripped RCD).
7. NEVER set action to "emergency" — emergencies are caught before you are called.
8. Keep questions short and conversational. Prefer chips over free text.
9. Set "note" for your internal reasoning — it is logged but never shown to the tenant.

## Budget
${budgetNote}

${slotConfigSection}

${currentSlotsSection}`
}

function buildSlotConfigSection(categorySlug: string | null): string {
  if (!categorySlug) {
    return `## Slot checklist
No category detected yet. First classify the issue, then ask slot questions.`
  }
  const config = getSlotConfig(categorySlug)
  if (!config) {
    return `## Slot checklist
Unknown category "${categorySlug}". Treat as "other".`
  }
  const slotLines = config.slots
    .map((s) => `  - ${s.key} (${s.input}${s.options ? ': ' + s.options.join(' / ') : ''})${s.when ? ' [conditional]' : ''}`)
    .join('\n')
  return `## Slot checklist for category: ${config.categorySlug}
${slotLines}

Default priority: ${config.defaultPriority} | SLA: ${config.defaultSlaHours}h | Routing: ${config.routing}`
}

function buildCurrentSlotsSection(slots: Record<string, unknown>): string {
  const entries = Object.entries(slots)
  if (entries.length === 0) {
    return '## Collected slots\nNone yet.'
  }
  const lines = entries.map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`).join('\n')
  return `## Collected slots\n${lines}`
}
