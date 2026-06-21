'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { usePathname } from 'next/navigation'
import AssistantPanel from './assistant-panel'

function deriveContext(pathname: string): { page: string; propertyId?: string } {
  // Extract property UUID from /properties/[id] or /properties/[id]/edit
  if (pathname.startsWith('/properties/')) {
    const parts = pathname.split('/')
    const segment = parts[2]
    if (segment && segment !== 'new') {
      const isEdit = parts[3] === 'edit'
      return { page: isEdit ? 'Edit Property' : 'Property Detail', propertyId: segment }
    }
  }
  if (pathname === '/properties') return { page: 'Portfolio' }
  if (pathname === '/maintenance') return { page: 'Maintenance' }
  if (pathname.startsWith('/maintenance')) return { page: 'Maintenance' }
  if (pathname === '/applications') return { page: 'Applications' }
  if (pathname.startsWith('/applications')) return { page: 'Applications' }
  if (pathname.startsWith('/electricity')) return { page: 'Electricity' }
  if (pathname === '/tenants') return { page: 'Tenants' }
  if (pathname.startsWith('/tenants')) return { page: 'Tenant Detail' }
  if (pathname === '/buildings') return { page: 'Buildings' }
  if (pathname === '/availability') return { page: 'Availability' }
  if (pathname.startsWith('/dashboard')) return { page: 'Dashboard' }
  return { page: 'Dashboard' }
}

export default function AssistantTrigger() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const context = deriveContext(pathname)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary-soft px-3 py-1.5 text-[12px] font-medium text-primary hover:bg-primary-softer hover:border-primary/50 transition-colors"
        title="Open AI Assistant"
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">AI Assistant</span>
      </button>

      <AssistantPanel
        isOpen={open}
        onClose={() => setOpen(false)}
        context={context}
      />
    </>
  )
}
