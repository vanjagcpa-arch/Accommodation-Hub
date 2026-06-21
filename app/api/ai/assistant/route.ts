import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { buildAssistantContext } from '@/lib/ai/context'

export const maxDuration = 60

const SYSTEM_PROMPT = `You are an operations assistant for a student accommodation management platform.
You help property managers answer operational questions about properties, tenants, applications, vacancies, maintenance jobs, and electricity billing.

Your data comes from the live application database and is provided in the DATA FROM SYSTEM section below.
Always base your answers on that data. If the data section is empty or does not contain what is needed to answer the question, say clearly that no matching records were found — do not invent information.

Your capabilities (read-only):
- Summarise properties, tenants, and buildings
- Review application status
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
If no relevant records exist in the data, say so clearly rather than guessing.
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

  // Require authentication — all DB queries run as the signed-in user (RLS enforced)
  let supabase: Awaited<ReturnType<typeof createClient>>
  try {
    supabase = await createClient()
  } catch {
    return NextResponse.json({ error: 'Database connection unavailable.' }, { status: 503 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'You must be signed in to use the assistant.' }, { status: 401 })
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

  // Fetch real data from the database (RLS filters by the user's company automatically)
  let toolResults: { label: string; result: unknown }[] = []
  let dataUsed: string[] = []
  try {
    const ctx = await buildAssistantContext(supabase, message, {
      page: context.page,
      propertyId: context.propertyId,
    })
    toolResults = ctx.toolResults
    dataUsed = ctx.dataUsed
  } catch (err) {
    console.error('[ai/assistant] context build failed:', err)
    // Continue with empty context — the AI will say no data is available
  }

  // Build user context string
  const contextParts: string[] = []
  if (context.page) contextParts.push(`Current page: ${context.page}`)
  if (context.propertyId) contextParts.push(`Property context (ID: ${context.propertyId})`)

  const dataContext = toolResults.length
    ? `\n\nDATA FROM SYSTEM (live app data):\n${JSON.stringify(toolResults, null, 2)}`
    : '\n\nDATA FROM SYSTEM: No data loaded for this query.'

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

    return NextResponse.json({
      answer,
      dataUsed: [...new Set(dataUsed)],
      usingMockData: false,
      context: {
        page: context.page,
        propertyId: context.propertyId,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const isAuthError = msg.includes('401') || msg.includes('API key') || msg.includes('Incorrect API key')

    return NextResponse.json(
      {
        error: isAuthError
          ? 'Invalid OpenAI API key. Check OPENAI_API_KEY in Vercel environment variables.'
          : `OpenAI error: ${msg}`,
      },
      { status: 500 }
    )
  }
}
