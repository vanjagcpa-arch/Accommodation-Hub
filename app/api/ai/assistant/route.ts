import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { AI_TOOLS } from '@/lib/ai/tools'

export const maxDuration = 60

const SYSTEM_PROMPT = `You are an operations assistant for a student accommodation management platform.
You help property managers answer operational questions about properties, tenants, applications, vacancies, maintenance jobs, and electricity billing.

Your data is currently MOCK/DEMO data. Always acknowledge this when relevant to the answer.

Your capabilities (read-only):
- Summarise properties, tenants, and buildings
- Review application status and missing documents
- Check vacancy status and prioritise leasing
- Review maintenance jobs and identify blockers
- Check electricity billing and payment status
- Recommend practical next actions
- Draft follow-up emails or SMS messages (for human review only)

Hard limits — never do these:
- Do not approve or reject applications
- Do not send emails or SMS messages yourself
- Do not update MYOB, Ezidebit, Reapit, or any database
- Do not delete documents or change records
- Do not recommend decisions based on nationality, ethnicity, religion, disability, age, gender, or any protected attribute
- Only use legitimate business criteria: application completeness, enrolment status, lease dates, vacancy age, maintenance blockers, payment status, and property readiness

When drafting messages, always say "This is a draft — please review before sending."
When recommending actions, be practical and concise.
If data is missing, say what is missing rather than guessing.
Format responses with clear headings and bullet points where it helps readability.
Keep answers focused on the operational question.`

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface RequestBody {
  message: string
  context?: {
    page?: string
    propertyCode?: string
    propertyId?: string
    applicantId?: string
    tenantId?: string
  }
  history?: Message[]
}

// Decide which tools to call based on the message + context
function selectTools(message: string, context: RequestBody['context']): {
  toolName: keyof typeof AI_TOOLS
  args: unknown[]
  label: string
}[] {
  const msg = message.toLowerCase()
  const tools: { toolName: keyof typeof AI_TOOLS; args: unknown[]; label: string }[] = []

  const propertyRef = context?.propertyCode

  // Always fetch daily summary if asking about "today" or "attention" or "overview"
  if (msg.includes('today') || msg.includes('attention') || msg.includes('summary') || msg.includes('overview') || msg.includes('dashboard')) {
    tools.push({ toolName: 'getDailyOperationsSummary', args: [], label: 'Daily operations summary' })
  }

  // Property-specific queries
  if (propertyRef) {
    if (msg.includes('summar') || msg.includes('overview') || msg.includes('about') || msg.includes('tell me')) {
      tools.push({ toolName: 'getPropertySummary', args: [propertyRef], label: `Property summary: ${propertyRef}` })
    }
    if (msg.includes('tenant') || msg.includes('who lives') || msg.includes('occupant')) {
      tools.push({ toolName: 'getTenantStatus', args: [propertyRef], label: `Tenant status: ${propertyRef}` })
    }
    if (msg.includes('vacant') || msg.includes('vacancy') || msg.includes('available')) {
      tools.push({ toolName: 'getVacancyStatus', args: [propertyRef], label: `Vacancy status: ${propertyRef}` })
    }
    if (msg.includes('application') || msg.includes('applicant')) {
      tools.push({ toolName: 'getApplicationsForProperty', args: [propertyRef], label: `Applications: ${propertyRef}` })
    }
    if (msg.includes('maintenance') || msg.includes('repair') || msg.includes('job')) {
      tools.push({ toolName: 'getOpenMaintenanceJobs', args: [propertyRef], label: `Maintenance jobs: ${propertyRef}` })
    }
    if (msg.includes('electric') || msg.includes('billing') || msg.includes('invoice') || msg.includes('payment')) {
      tools.push({ toolName: 'getElectricityBillingStatus', args: [propertyRef], label: `Electricity billing: ${propertyRef}` })
    }
    if (msg.includes('owe') || msg.includes('debt') || msg.includes('overdue') || msg.includes('payment')) {
      tools.push({ toolName: 'getPaymentStatus', args: [propertyRef], label: `Payment status: ${propertyRef}` })
    }
    // Default for property context: load full summary
    if (tools.length === 0) {
      tools.push({ toolName: 'getPropertySummary', args: [propertyRef], label: `Property summary: ${propertyRef}` })
    }
  }

  // Global queries (no specific property context)
  if (!propertyRef || tools.length === 0) {
    if (msg.includes('vacant') || msg.includes('vacancy') || msg.includes('priorit') || msg.includes('available')) {
      tools.push({ toolName: 'getVacantApartments', args: [], label: 'Vacant apartments' })
    }
    if (msg.includes('application') || msg.includes('applicant') || msg.includes('review') || msg.includes('document') || msg.includes('missing')) {
      tools.push({ toolName: 'getApplicationsNeedingReview', args: [], label: 'Applications needing review' })
    }
    if (msg.includes('maintenance') || msg.includes('repair') || msg.includes('job') || msg.includes('block')) {
      tools.push({ toolName: 'getOpenMaintenanceJobs', args: [], label: 'Open maintenance jobs' })
    }
    if (msg.includes('block') || msg.includes('leasing') || msg.includes('prevent')) {
      tools.push({ toolName: 'getMaintenanceBlockingLeasing', args: [], label: 'Maintenance blocking leasing' })
    }
    if (msg.includes('electric') || msg.includes('billing') || msg.includes('invoice') || msg.includes('overdue')) {
      tools.push({ toolName: 'getOverdueElectricityAccounts', args: [], label: 'Overdue electricity accounts' })
    }
    if (msg.includes('owe') || msg.includes('debt') || msg.includes('payment')) {
      tools.push({ toolName: 'getOverdueElectricityAccounts', args: [], label: 'Overdue accounts' })
    }

    // Fallback: load daily summary if still no tools selected
    if (tools.length === 0) {
      tools.push({ toolName: 'getDailyOperationsSummary', args: [], label: 'Daily operations summary' })
    }
  }

  // Deduplicate by toolName+args
  const seen = new Set<string>()
  return tools.filter((t) => {
    const key = `${t.toolName}:${JSON.stringify(t.args)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function POST(request: Request) {
  // Validate API key
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'OpenAI API key not configured.',
        hint: 'Add OPENAI_API_KEY to your Vercel environment variables and redeploy.',
      },
      { status: 503 }
    )
  }

  let body: RequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { message, context = {}, history = [] } = body

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required.' }, { status: 400 })
  }

  // Run selected tools
  const selectedTools = selectTools(message, context)
  const toolResults: { label: string; result: unknown }[] = []
  const allDataUsed: string[] = []

  for (const tool of selectedTools) {
    try {
      const fn = AI_TOOLS[tool.toolName] as (...args: unknown[]) => { data: unknown; dataUsed: string[]; missingData?: string[] }
      const result = fn(...tool.args)
      toolResults.push({ label: tool.label, result: result.data })
      allDataUsed.push(...result.dataUsed)
    } catch (err) {
      toolResults.push({ label: tool.label, result: { error: String(err) } })
    }
  }

  // Build context message for the AI
  const contextParts: string[] = []
  if (context.page) contextParts.push(`Current page: ${context.page}`)
  if (context.propertyCode) contextParts.push(`Selected property: ${context.propertyCode}`)

  const dataContext = toolResults.length
    ? `\n\nDATA FROM SYSTEM (mock data):\n${JSON.stringify(toolResults, null, 2)}`
    : ''

  const contextString = contextParts.length
    ? `\n\nUSER CONTEXT:\n${contextParts.join('\n')}`
    : ''

  // Build message list
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT + contextString + dataContext },
    ...history.slice(-8).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: message },
  ]

  try {
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.3,
      max_tokens: 1200,
    })

    const answer = completion.choices[0]?.message?.content ?? 'No response generated.'

    // Deduplicate data used list
    const uniqueDataUsed = [...new Set(allDataUsed)]

    return NextResponse.json({
      answer,
      dataUsed: uniqueDataUsed,
      usingMockData: true,
      context: {
        page: context.page,
        propertyCode: context.propertyCode,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const isAuthError = message.includes('401') || message.includes('API key') || message.includes('Incorrect API key')

    return NextResponse.json(
      {
        error: isAuthError
          ? 'Invalid OpenAI API key. Check OPENAI_API_KEY in Vercel environment variables.'
          : `OpenAI error: ${message}`,
      },
      { status: 500 }
    )
  }
}
