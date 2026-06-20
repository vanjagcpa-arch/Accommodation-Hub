'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import AssistantPanel from './assistant-panel'

interface Props {
  context: {
    page: string
    propertyCode?: string
    propertyId?: string
    applicantId?: string
    tenantId?: string
  }
  suggestedPrompts?: string[]
  label?: string
}

export default function PageAssistantButton({ context, suggestedPrompts, label = 'Ask AI' }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary-soft px-3 py-1.5 text-[12px] font-medium text-primary hover:bg-primary-softer hover:border-primary/50 transition-colors"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {label}
      </button>

      <AssistantPanel
        isOpen={open}
        onClose={() => setOpen(false)}
        context={context}
        suggestedPrompts={suggestedPrompts}
      />
    </>
  )
}
