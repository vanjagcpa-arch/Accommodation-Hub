import { z } from 'zod'

// ── Per-turn JSON contract ────────────────────────────────────────────────────
// The model returns exactly one TriageTurn per POST. Validated with zod; on
// parse failure the agent falls back to a free-text re-prompt.

export const QuestionSchema = z.object({
  slot: z.string(),
  text: z.string(),
  input: z.enum(['chips', 'dropdown', 'toggle', 'text', 'photo']),
  options: z.array(z.string()).optional(),
})

export const SelfHelpSchema = z.object({
  title: z.string(),
  steps: z.array(z.string()),
})

export const JobPayloadSchema = z.object({
  category: z.string(),
  priority: z.enum(['urgent', 'high', 'medium', 'low']),
  sla_hours: z.number(),
  routing: z.string(),
  summary: z.string(),
  blocking_leasing: z.boolean(),
  slots: z.record(z.string(), z.unknown()),
})

export const TriageTurnSchema = z.object({
  extracted: z.record(z.string(), z.union([z.string(), z.boolean()])),
  category: z.enum(['plumbing', 'electrical', 'heating', 'appliance', 'other']).nullable(),
  confidence: z.number().min(0).max(1),
  action: z.enum(['ask', 'self_help', 'emergency', 'finalize']),
  question: QuestionSchema.optional(),
  self_help: SelfHelpSchema.optional(),
  job: JobPayloadSchema.optional(),
  note: z.string().optional(),
})

export type TriageTurn = z.infer<typeof TriageTurnSchema>
export type QuestionTurn = z.infer<typeof QuestionSchema>
export type JobPayload = z.infer<typeof JobPayloadSchema>

// ── Thread / message shapes returned to the client ───────────────────────────

export interface IntakeThread {
  id: string
  company_id: string
  occupancy_id: string | null
  tenant_id: string | null
  source: string
  category_id: string | null
  status: 'open' | 'finalized' | 'deflected' | 'emergency' | 'abandoned'
  slots: Record<string, unknown>
  confidence: number | null
  question_count: number
  job_id: string | null
  created_at: string
  updated_at: string
}

export interface IntakeMessage {
  id: string
  thread_id: string
  role: 'tenant' | 'agent'
  content: Record<string, unknown>
  created_at: string
}

// ── OpenAI JSON schema (for response_format.json_schema) ─────────────────────
// Hand-crafted from TriageTurnSchema so OpenAI enforces it server-side.
export const TRIAGE_TURN_JSON_SCHEMA = {
  name: 'triage_turn',
  strict: true,
  schema: {
    type: 'object',
    required: ['extracted', 'category', 'confidence', 'action'],
    additionalProperties: false,
    properties: {
      extracted: {
        type: 'object',
        description: 'Slot values extracted from the latest tenant message.',
        additionalProperties: { type: ['string', 'boolean'] },
      },
      category: {
        type: ['string', 'null'],
        enum: ['plumbing', 'electrical', 'heating', 'appliance', 'other', null],
        description: 'Detected issue category, or null if not yet determined.',
      },
      confidence: {
        type: 'number',
        description: 'Category confidence 0–1.',
      },
      action: {
        type: 'string',
        enum: ['ask', 'self_help', 'emergency', 'finalize'],
        description: 'What the agent should do next.',
      },
      question: {
        type: 'object',
        required: ['slot', 'text', 'input'],
        additionalProperties: false,
        properties: {
          slot: { type: 'string' },
          text: { type: 'string' },
          input: { type: 'string', enum: ['chips', 'dropdown', 'toggle', 'text', 'photo'] },
          options: { type: 'array', items: { type: 'string' } },
        },
        description: 'Present when action is "ask".',
      },
      self_help: {
        type: 'object',
        required: ['title', 'steps'],
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          steps: { type: 'array', items: { type: 'string' } },
        },
        description: 'Present when action is "self_help".',
      },
      job: {
        type: 'object',
        required: ['category', 'priority', 'sla_hours', 'routing', 'summary', 'blocking_leasing', 'slots'],
        additionalProperties: false,
        properties: {
          category:         { type: 'string' },
          priority:         { type: 'string', enum: ['urgent', 'high', 'medium', 'low'] },
          sla_hours:        { type: 'number' },
          routing:          { type: 'string' },
          summary:          { type: 'string' },
          blocking_leasing: { type: 'boolean' },
          slots:            { type: 'object', additionalProperties: true },
        },
        description: 'Present when action is "finalize".',
      },
      note: {
        type: 'string',
        description: 'Internal reasoning — never sent to client.',
      },
    },
  },
}
