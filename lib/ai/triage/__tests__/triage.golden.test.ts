/**
 * Golden scenarios for the triage agent.
 *
 * Each test drives the agent through a scripted conversation, mocking OpenAI
 * responses, and asserts the finalized job shape.
 *
 * Run:  npx vitest run lib/ai/triage/__tests__/triage.golden.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TriageTurn } from '../contract'

// ── Shared mutable mock for OpenAI create ─────────────────────────────────────
// vi.hoisted ensures this runs before vi.mock hoisting, so the class can ref it.
const mockCreate = vi.hoisted(() => vi.fn())

vi.mock('openai', () => ({
  default: class MockOpenAI {
    chat = { completions: { create: mockCreate } }
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockCreate.mockReset()
})

// ── Mock Supabase ─────────────────────────────────────────────────────────────
function makeSupabaseMock() {
  const inserted: unknown[] = []
  const updated: unknown[] = []

  const mock: Record<string, unknown> = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    _inserted: inserted,
    _updated: updated,
  }

  return mock
}

// ── Helper: configure OpenAI to return a scripted sequence of turns ───────────
function scriptOpenAI(turns: TriageTurn[]) {
  let call = 0
  mockCreate.mockImplementation(() => {
    const turn = turns[Math.min(call, turns.length - 1)]
    call++
    return Promise.resolve({
      choices: [{ message: { content: JSON.stringify(turn) } }],
    })
  })
}

// ── Thread state returned by supabase single() ────────────────────────────────
function threadData(id = 'thread-1', overrides: Record<string, unknown> = {}) {
  return {
    id,
    category_id: null,
    status: 'open',
    slots: {},
    confidence: null,
    question_count: 0,
    maintenance_categories: null,
    ...overrides,
  }
}

// ── Setup supabase mock with a chained insert that returns a job ──────────────
function setupSupabase(supabase: ReturnType<typeof makeSupabaseMock>, jobId = 'job-1', threadId = 'thread-1') {
  const jobSingle = vi.fn().mockResolvedValue({ data: { id: jobId }, error: null })
  const threadSingle = vi.fn().mockResolvedValue({ data: threadData(threadId), error: null })

  // Thread upsert returns thread data; job insert returns job id
  ;(supabase.single as ReturnType<typeof vi.fn>)
    .mockResolvedValueOnce({ data: threadData(threadId), error: null })  // upsertThread lookup
    .mockResolvedValue({ data: { id: jobId }, error: null })             // insert job single

  // insert().select().single() chain for job
  const selectMock = vi.fn().mockReturnValue({ single: jobSingle })
  ;(supabase.insert as ReturnType<typeof vi.fn>).mockReturnValue({ select: selectMock })

  // update().eq() for thread status
  ;(supabase.update as ReturnType<typeof vi.fn>).mockReturnThis()
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Triage Agent Golden Scenarios', () => {

  describe('Scenario 1: shower leaking → finalize plumbing job', () => {
    it('classifies plumbing and produces a high-priority plumber job', async () => {
      const supabase = makeSupabaseMock()

      // Thread on each lookup returns the same thread (accumulating)
      ;(supabase.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: threadData(),
        error: null,
      })
      const jobSingle = vi.fn().mockResolvedValue({ data: { id: 'job-plumbing-1' }, error: null })
      ;(supabase.insert as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({ single: jobSingle }),
      })

      scriptOpenAI([
        {
          extracted: { issue_type: 'Leaking / dripping' },
          category: 'plumbing',
          confidence: 0.9,
          action: 'ask',
          question: { slot: 'is_active_leak', text: 'Is water actively leaking right now?', input: 'toggle' },
        },
        {
          extracted: { is_active_leak: true },
          category: 'plumbing',
          confidence: 0.95,
          action: 'ask',
          question: { slot: 'leak_rate', text: 'How fast?', input: 'chips', options: ['Drip', 'Steady stream', 'Gushing'] },
        },
        {
          extracted: { leak_rate: 'Steady trickle' },
          category: 'plumbing',
          confidence: 0.97,
          action: 'ask',
          question: { slot: 'location', text: 'Which area?', input: 'chips', options: ['Bathroom', 'Kitchen'] },
        },
        {
          extracted: { location: 'Bathroom' },
          category: 'plumbing',
          confidence: 0.98,
          action: 'ask',
          question: { slot: 'photo', text: 'Photo?', input: 'photo' },
        },
        {
          extracted: {},
          category: 'plumbing',
          confidence: 0.98,
          action: 'finalize',
          job: {
            category: 'plumbing',
            priority: 'high',
            sla_hours: 24,
            routing: 'internal_plumber',
            summary: 'Leaking shower — steady trickle, bathroom',
            blocking_leasing: false,
            slots: { issue_type: 'Leaking / dripping', is_active_leak: true, leak_rate: 'Steady trickle', location: 'Bathroom' },
          },
        },
      ])

      const { runTriageAgent } = await import('../agent')

      let threadId: string | undefined
      let last: Awaited<ReturnType<typeof runTriageAgent>> | undefined

      for (const msg of ['shower is leaking', 'Yes', 'Steady trickle', 'Bathroom', 'skip']) {
        last = await runTriageAgent(supabase as any, { threadId, message: msg, companyId: 'company-1' })
        threadId = last.threadId
      }

      expect(last?.turn.action).toBe('finalize')
      expect(last?.turn.category).toBe('plumbing')
      expect(last?.turn.job?.priority).toBe('high')
      expect(last?.turn.job?.routing).toBe('internal_plumber')
    })
  })

  describe('Scenario 2: no power in kitchen', () => {
    it('classifies electrical, routes internal_electrician', async () => {
      const supabase = makeSupabaseMock()
      ;(supabase.single as ReturnType<typeof vi.fn>).mockResolvedValue({ data: threadData(), error: null })
      ;(supabase.insert as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'job-elec-1' }, error: null }),
        }),
      })

      scriptOpenAI([
        {
          extracted: { issue_type: 'No power / outage' },
          category: 'electrical',
          confidence: 0.88,
          action: 'ask',
          question: { slot: 'scope', text: 'How much is affected?', input: 'chips', options: ['One room', 'Whole flat'] },
        },
        {
          extracted: { scope: 'One room' },
          category: 'electrical',
          confidence: 0.93,
          action: 'finalize',
          job: {
            category: 'electrical',
            priority: 'high',
            sla_hours: 24,
            routing: 'internal_electrician',
            summary: 'No power in kitchen — one room',
            blocking_leasing: false,
            slots: { issue_type: 'No power / outage', scope: 'One room' },
          },
        },
      ])

      const { runTriageAgent } = await import('../agent')
      let threadId: string | undefined
      let last: Awaited<ReturnType<typeof runTriageAgent>> | undefined

      for (const msg of ['no power in kitchen', 'One room']) {
        last = await runTriageAgent(supabase as any, { threadId, message: msg, companyId: 'company-1' })
        threadId = last.threadId
      }

      expect(last?.turn.action).toBe('finalize')
      expect(last?.turn.category).toBe('electrical')
      expect(last?.turn.job?.routing).toBe('internal_electrician')
    })
  })

  describe('Scenario 3: heating won\'t turn on', () => {
    it('classifies heating, routes hvac_contractor', async () => {
      const supabase = makeSupabaseMock()
      ;(supabase.single as ReturnType<typeof vi.fn>).mockResolvedValue({ data: threadData(), error: null })
      ;(supabase.insert as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'job-hvac-1' }, error: null }),
        }),
      })

      scriptOpenAI([
        {
          extracted: { issue_type: 'No heating' },
          category: 'heating',
          confidence: 0.92,
          action: 'ask',
          question: { slot: 'scope', text: 'Which areas?', input: 'chips', options: ['One room', 'Whole flat'] },
        },
        {
          extracted: { scope: 'Whole flat' },
          category: 'heating',
          confidence: 0.94,
          action: 'ask',
          question: { slot: 'has_error_code', text: 'Error code showing?', input: 'toggle' },
        },
        {
          extracted: { has_error_code: false },
          category: 'heating',
          confidence: 0.95,
          action: 'finalize',
          job: {
            category: 'heating',
            priority: 'medium',
            sla_hours: 48,
            routing: 'hvac_contractor',
            summary: 'Heating not working — whole flat, no error code',
            blocking_leasing: false,
            slots: { issue_type: 'No heating', scope: 'Whole flat', has_error_code: false },
          },
        },
      ])

      const { runTriageAgent } = await import('../agent')
      let threadId: string | undefined
      let last: Awaited<ReturnType<typeof runTriageAgent>> | undefined

      for (const msg of ['heating won\'t turn on', 'Whole flat', 'No']) {
        last = await runTriageAgent(supabase as any, { threadId, message: msg, companyId: 'company-1' })
        threadId = last.threadId
      }

      expect(last?.turn.action).toBe('finalize')
      expect(last?.turn.category).toBe('heating')
      expect(last?.turn.job?.routing).toBe('hvac_contractor')
    })
  })

  describe('Scenario 4: gas smell → emergency (no model call)', () => {
    it('short-circuits before any model call, returns emergency action', async () => {
      const supabase = makeSupabaseMock()
      ;(supabase.single as ReturnType<typeof vi.fn>).mockResolvedValue({ data: threadData('thread-emerg'), error: null })

      // Ensure create is never called
      mockCreate.mockImplementation(() => {
        throw new Error('model should not be called for emergency')
      })

      const { runTriageAgent } = await import('../agent')
      const result = await runTriageAgent(supabase as any, {
        message: 'I can smell gas in my flat',
        companyId: 'company-1',
      })

      expect(result.turn.action).toBe('emergency')
      expect(mockCreate).not.toHaveBeenCalled()
      expect(result.turn.category).toBeNull()
    })
  })

  describe('Scenario 5: tripped RCD → self_help, no job created', () => {
    it('returns self_help action and does not write a maintenance_jobs row', async () => {
      const supabase = makeSupabaseMock()
      ;(supabase.single as ReturnType<typeof vi.fn>).mockResolvedValue({ data: threadData(), error: null })

      scriptOpenAI([
        {
          extracted: { issue_type: 'Tripped circuit / RCD' },
          category: 'electrical',
          confidence: 0.85,
          action: 'self_help',
          self_help: {
            title: 'Reset the RCD',
            steps: [
              'Locate your switchboard (usually near the front door or hallway cupboard).',
              'Find the RCD switch — it will be in the tripped / middle position.',
              'Push it fully DOWN (off) then firmly UP (on).',
              'If it trips again, unplug all appliances and retry.',
              'If it keeps tripping, submit a maintenance request.',
            ],
          },
        },
      ])

      const { runTriageAgent } = await import('../agent')
      const result = await runTriageAgent(supabase as any, {
        message: 'lights tripped after I plugged in the kettle',
        companyId: 'company-1',
      })

      expect(result.turn.action).toBe('self_help')
      expect(result.turn.self_help?.title).toContain('RCD')
      expect(result.jobId).toBeUndefined()
    })
  })
})
